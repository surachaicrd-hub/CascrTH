<script setup>
import { ref, onMounted, computed } from 'vue'
import draggable from 'vuedraggable'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import { ClassicEditor, Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo, Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed, BlockQuote } from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'
import { apiFetch } from '../../utils/apiFetch'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()
const { showConfirm } = useConfirm()
const editor = ClassicEditor
const editorConfig = ref({
    licenseKey: 'GPL',
    plugins: [
        Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo,
        Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed, BlockQuote
    ],
    toolbar: [
        'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', '|',
        'link', 'uploadImage', 'mediaEmbed', 'insertTable', 'blockQuote', 'bulletedList', 'numberedList'
    ],
    table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
    image: {
        toolbar: ['imageTextAlternative', 'toggleImageCaption', '|', 'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|', 'resizeImage']
    },
    simpleUpload: {
        uploadUrl: `${import.meta.env.VITE_API_URL || ''}/api/upload/ckeditor`,
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    }
})

const articles = ref([])
const loading = ref(true)
const showEditor = ref(false)
const saving = ref(false)
const editingId = ref(null)
const searchQuery = ref('')
const filterStatus = ref('all')
const currentPage = ref(1)
const totalPages = ref(1)
const totalArticles = ref(0)
let searchTimer = null

const allImages = ref([])
const uploadingImages = ref(false)

// Active states for UI feedback
const deletingId = ref(null)

// AI Generation
const productsList = ref([])
const aiProductId = ref('')
const aiStyle = ref('educational')
const aiPrompt = ref('')
const generating = ref(false)
const aiStyles = [
    { id: 'educational', svg: '<svg class="w-6 h-6 text-indigo-500 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>', name: 'ให้ความรู้', desc: 'อธิบายข้อมูลเชิงลึก' },
    { id: 'sales', svg: '<svg class="w-6 h-6 text-orange-500 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>', name: 'ขายของ', desc: 'เน้นจุดเด่น + CTA' },
    { id: 'howto', svg: '<svg class="w-6 h-6 text-emerald-500 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>', name: 'วิธีใช้/ดูแล', desc: 'ขั้นตอน + Checklist' },
    { id: 'comparison', svg: '<svg class="w-6 h-6 text-blue-500 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>', name: 'เปรียบเทียบ', desc: 'ตาราง Pros/Cons' },
    { id: 'review', svg: '<svg class="w-6 h-6 text-rose-500 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>', name: 'รีวิว', desc: 'ประสบการณ์ใช้จริง' },
]
const showProductDropdown = ref(false)
const showFormProductDropdown = ref(false)

const form = ref({
    title: '', excerpt: '', content: '', cover_image: '',
    category: 'ทั่วไป', tags: '', seo_title: '', seo_description: '', seo_keywords: '',
    is_published: false, is_featured: false, author: 'Admin',
    product_id: null, gallery_images: [], faq: [], llm_context: '', image_prompt: ''
})

const categories = ['ทั่วไป', 'บ้านเก็บของ', 'เคล็ดลับ', 'การดูแลรักษา', 'ข่าวสาร', 'โปรโมชั่น']

const filteredArticles = computed(() => articles.value)

const loadArticles = async () => {
    loading.value = true
    try {
        const params = new URLSearchParams({ page: currentPage.value, limit: 20 })
        if (searchQuery.value) params.append('search', searchQuery.value)
        if (filterStatus.value !== 'all') params.append('status', filterStatus.value)
        
        const res = await apiFetch(`/api/articles?${params}`)
        const data = await res.json()
        if (data.success) {
            articles.value = data.data
            if (data.pagination) {
                totalPages.value = data.pagination.totalPages
                totalArticles.value = data.pagination.total
            }
        }
    } catch (e) { console.error(e) } finally { loading.value = false }
}

const changePage = (p) => {
    currentPage.value = p
    loadArticles()
}

// Debounced search
const onSearchInput = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        currentPage.value = 1
        loadArticles()
    }, 400)
}

const onFilterChange = () => {
    currentPage.value = 1
    loadArticles()
}

const paginationRange = computed(() => {
    const range = []
    const total = totalPages.value
    const current = currentPage.value
    const delta = 2
    let left = Math.max(2, current - delta)
    let right = Math.min(total - 1, current + delta)
    
    range.push(1)
    if (left > 2) range.push('...')
    for (let i = left; i <= right; i++) range.push(i)
    if (right < total - 1) range.push('...')
    if (total > 1) range.push(total)
    return range
})

const openNew = () => {
    editingId.value = null
    form.value = { title: '', excerpt: '', content: '', cover_image: '', category: 'ทั่วไป', tags: '', seo_title: '', seo_description: '', seo_keywords: '', is_published: false, is_featured: false, author: 'Admin', product_id: null, gallery_images: [], faq: [], llm_context: '', image_prompt: '' }
    allImages.value = []
    showEditor.value = true
}

const openEdit = (article) => {
    editingId.value = article.id
    form.value = { 
        ...article, 
        image_prompt: article.image_prompt || '',
        tags: typeof article.tags === 'string' ? article.tags : JSON.stringify(article.tags || []),
        gallery_images: typeof article.gallery_images === 'string' ? JSON.parse(article.gallery_images || '[]') : (article.gallery_images || []),
        faq: typeof article.faq === 'string' ? JSON.parse(article.faq || '[]') : (article.faq || [])
    }
    
    const arr = []
    if (form.value.cover_image) arr.push(form.value.cover_image)
    if (Array.isArray(form.value.gallery_images)) arr.push(...form.value.gallery_images)
    allImages.value = arr.filter(Boolean)
    
    showEditor.value = true
}

const save = async () => {
    if (!form.value.title) { showToast('กรุณาใส่หัวข้อบทความ', 'warning'); return }
    
    if (allImages.value.length > 0) {
        form.value.cover_image = allImages.value[0]
        form.value.gallery_images = allImages.value.slice(1)
    } else {
        form.value.cover_image = ''
        form.value.gallery_images = []
    }
    
    saving.value = true
    try {
        const url = editingId.value ? `/api/articles/${editingId.value}` : '/api/articles'
        const method = editingId.value ? 'PUT' : 'POST'
        const res = await apiFetch(url, { method, body: JSON.stringify(form.value) })
        const data = await res.json()
        if (data.success) {
            showToast(editingId.value ? 'อัปเดตบทความเรียบร้อย' : 'สร้างบทความเรียบร้อย', 'success')
            if (!editingId.value && data.id) {
                editingId.value = data.id // Update ID so next save is a PUT
            }
            loadArticles()
        } else { showToast(data.error || 'เกิดข้อผิดพลาด', 'error') }
    } catch (e) { showToast('เกิดข้อผิดพลาด', 'error') } finally { saving.value = false }
}

const deleteArticle = async (article) => {
    if (deletingId.value) return // Prevent double delete
    const confirmed = await showConfirm(`ลบบทความ "${article.title}" ?`, 'ยืนยันการลบ')
    if (!confirmed) return
    
    deletingId.value = article.id
    try {
        const res = await apiFetch(`/api/articles/${article.id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) { showToast('ลบบทความเรียบร้อย', 'success'); loadArticles() }
    } catch (e) { showToast('เกิดข้อผิดพลาด', 'error') } finally {
        deletingId.value = null
    }
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
      callback(data.imageUrl || data.url)
    } else {
      showToast('อัพโหลดไม่สำเร็จ: ' + data.error, 'error')
    }
  } catch (error) {
    console.error('Upload Error:', error)
  }
}

const handleImagesUpload = async (event) => {
    const files = Array.from(event.target.files || event.dataTransfer?.files || [])
    if (files.length === 0) return

    uploadingImages.value = true
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        await uploadFile(file, (url) => { allImages.value.push(url) })
    }
    uploadingImages.value = false
    if (event.target.value) event.target.value = ''
}

const handleImagesDrop = (e) => { handleImagesUpload(e) }

const removeImage = (index) => {
    allImages.value.splice(index, 1)
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'


const loadProducts = async () => {
    try {
        const res = await apiFetch('/api/products')
        const data = await res.json()
        if (data.success) productsList.value = (data.data || []).filter(p => p.is_active)
    } catch (e) { /* */ }
}

const generateArticle = async () => {
    if (!aiStyle.value) { showToast('กรุณาเลือกสไตล์บทความ', 'warning'); return }
    generating.value = true
    try {
        const res = await apiFetch('/api/articles/generate', {
            method: 'POST',
            body: JSON.stringify({ productId: aiProductId.value || null, style: aiStyle.value, additionalPrompt: aiPrompt.value })
        })
        const data = await res.json()
        if (data.success && data.data) {
            form.value.title = data.data.title || form.value.title
            form.value.excerpt = data.data.excerpt || form.value.excerpt
            form.value.content = data.data.content || form.value.content
            form.value.seo_title = data.data.seo_title || form.value.seo_title
            form.value.seo_description = data.data.seo_description || form.value.seo_description
            form.value.seo_keywords = data.data.seo_keywords || form.value.seo_keywords
            form.value.tags = data.data.tags || form.value.tags
            form.value.llm_context = data.data.llm_context || form.value.llm_context
            if (data.data.image_prompt) {
                form.value.image_prompt = data.data.image_prompt
            }
            if (Array.isArray(data.data.faq) && data.data.faq.length > 0) {
                if (form.value.faq.length === 0) {
                    form.value.faq = data.data.faq
                } else {
                    form.value.faq = [...form.value.faq, ...data.data.faq]
                }
            }
            if (data.data.category) form.value.category = data.data.category
            if (aiProductId.value) form.value.product_id = aiProductId.value
            showToast('สร้างบทความและข้อมูล AI ทั้งหมดเรียบร้อยแล้ว!', 'success')
        } else {
            showToast(data.error || 'ไม่สามารถสร้างบทความ ลองใหม่', 'error')
        }
    } catch (e) { showToast('เกิดข้อผิดพลาด', 'error') } finally { generating.value = false }
}

const generatingPrompt = ref(false)

const copyPrompt = () => {
    navigator.clipboard.writeText(form.value.image_prompt)
    showToast('คัดลอก Prompt แล้ว', 'success')
}

const generateImagePrompt = async () => {
    if (!form.value.title && !form.value.content) {
        showToast('กรุณากรอกหัวข้อเนื้อหา หรือรายละเอียดก่อนสร้าง Prompt ด้วย AI', 'warning')
        return
    }
    generatingPrompt.value = true
    try {
        const res = await apiFetch('/api/articles/generate-prompt', {
            method: 'POST',
            body: JSON.stringify({ 
                title: form.value.title,
                prompt: aiPrompt.value
            })
        })
        const data = await res.json()
        
        if (data.success && data.prompt) {
            form.value.image_prompt = data.prompt
            showToast('สร้าง Prompt สำหรับวาดรูปปกด้วย AI สำเร็จ!', 'success')
        } else {
            showToast(data.error || 'ไม่สามารถสร้าง Prompt ได้ ลองใหม่อีกครั้ง', 'error')
        }
    } catch (e) {
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI', 'error')
        console.error(e)
    } finally {
        generatingPrompt.value = false
    }
}

const currentAiProduct = computed(() => {
    return productsList.value.find(p => p.id === aiProductId.value) || null
})

const currentFormProduct = computed(() => {
    return productsList.value.find(p => p.id === form.value.product_id) || null
})

// Generate ALL SEO and AI fields (unified - replaces old generateSeo)
const generatingAll = ref(false)
const generateAllAiData = async () => {
    if (!form.value.title && !form.value.content) {
        showToast('กรุณากรอกหัวข้อหรือเนื้อหาบทความก่อนวิเคราะห์ SEO', 'warning')
        return
    }
    generatingAll.value = true
    try {
        const res = await apiFetch('/api/articles/generate-all-seo', {
            method: 'POST',
            body: JSON.stringify({ 
                title: form.value.title,
                excerpt: form.value.excerpt,
                content: form.value.content,
                tags: form.value.tags
            })
        })
        const data = await res.json()
        if (data.success && data.data) {
            form.value.seo_title = data.data.seo_title || form.value.seo_title
            form.value.seo_description = data.data.seo_description || form.value.seo_description
            form.value.seo_keywords = data.data.seo_keywords || form.value.seo_keywords
            form.value.llm_context = data.data.llm_context || form.value.llm_context
            
            // Replace FAQ entirely to prevent accumulation on repeated clicks
            if (Array.isArray(data.data.faq) && data.data.faq.length > 0) {
                form.value.faq = data.data.faq
            }
            showToast('วิเคราะห์และสร้าง SEO + AI Data เรียบร้อย', 'success')
        } else {
            showToast(data.error || 'ไม่สามารถสร้างข้อมูลได้ ลองใหม่อีกครั้ง', 'error')
        }
    } catch (e) {
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
        console.error(e)
    } finally {
        generatingAll.value = false
    }
}


// AI FAQ Generation
const generatingFaq = ref(false)
const generateFaq = async () => {
    if (!form.value.title && !form.value.content) {
        showToast('กรุณากรอกหัวข้อหรือรายละเอียดก่อนสร้าง FAQ ด้วย AI', 'warning')
        return
    }
    generatingFaq.value = true
    try {
        const res = await apiFetch('/api/ai/generate-faq', {
            method: 'POST',
            body: JSON.stringify({ 
                name: form.value.title,
                description: form.value.content,
                type: 'article'
            })
        })
        const data = await res.json()
        if (data.success && data.data && Array.isArray(data.data)) {
            // Append to existing FAQ or replace if empty
            if (form.value.faq.length === 0) {
                form.value.faq = data.data
            } else {
                form.value.faq = [...form.value.faq, ...data.data]
            }
            showToast('ดึงคำถามที่พบบ่อย (FAQ) ด้วย AI สำเร็จ', 'success')
        } else {
            showToast(data.error || 'ไม่สามารถสร้าง FAQ ได้ ลองใหม่อีกครั้ง', 'error')
        }
    } catch (e) {
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
        console.error(e)
    } finally {
        generatingFaq.value = false
    }
}

const addFaq = () => {
    form.value.faq.push({ question: '', answer: '' })
}
const removeFaq = async (index) => {
    form.value.faq.splice(index, 1)
    // Auto-save to persist deletion immediately (only if editing existing article)
    if (editingId.value) {
        await save()
    }
}

// ========== Article Automation ==========
const activeMainTab = ref('list')
const autoArticleConfig = ref({ enabled: false, time: '08:00', style: 'educational', product_ids: [], last_generated_date: null })
const loadingAutoArticle = ref(false)
const savingAutoArticle = ref(false)
const testingAutoArticle = ref(false)
const autoProductSearch = ref('')

const filteredAutoProducts = computed(() => {
  if (!autoProductSearch.value) return productsList.value
  const s = autoProductSearch.value.toLowerCase()
  return productsList.value.filter(p => p.name.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s))
})

async function fetchAutoArticleConfig() {
  loadingAutoArticle.value = true
  try {
    const r = await (await apiFetch('/api/articles/admin/article-automation')).json()
    if (r.success && r.config) autoArticleConfig.value = r.config
  } catch(e) { console.error(e) }
  finally { loadingAutoArticle.value = false }
}

async function saveAutoArticleConfig() {
  savingAutoArticle.value = true
  try {
    const r = await (await apiFetch('/api/articles/admin/article-automation', {
      method: 'POST',
      body: JSON.stringify(autoArticleConfig.value)
    })).json()
    showToast(r.success ? 'บันทึกการตั้งค่าแล้ว' : (r.error || 'เกิดข้อผิดพลาด'), r.success ? 'success' : 'error')
  } catch(e) { showToast('เกิดข้อผิดพลาด', 'error') }
  finally { savingAutoArticle.value = false }
}

async function testAutoArticle() {
  testingAutoArticle.value = true
  try {
    const r = await (await apiFetch('/api/articles/admin/article-automation/test', {
      method: 'POST',
      body: JSON.stringify({})
    })).json()
    if (r.success) {
      showToast(`สร้างบทความสำเร็จ: "${r.title}"`, 'success')
      loadArticles()
    } else {
      showToast('ข้อผิดพลาด: ' + (r.error || ''), 'error')
    }
  } catch(e) { showToast('เกิดข้อผิดพลาด', 'error') }
  finally { testingAutoArticle.value = false }
}

function toggleAutoProduct(id) {
  if (!autoArticleConfig.value.product_ids) autoArticleConfig.value.product_ids = []
  const idx = autoArticleConfig.value.product_ids.indexOf(id)
  if (idx > -1) autoArticleConfig.value.product_ids.splice(idx, 1)
  else autoArticleConfig.value.product_ids.push(id)
}

onMounted(() => { loadArticles(); loadProducts(); fetchAutoArticleConfig() })
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div v-show="!showEditor" class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div class="p-2 bg-indigo-100 rounded-xl"><svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg></div>
          จัดการบทความ
        </h1>
        <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">เขียนบทความเพื่อเพิ่ม SEO และดึงดูดผู้เข้าชม
          <InfoTooltip title="ระบบบทความคืออะไร?" description="บทความช่วยให้เว็บไซต์ติดอันดับ Google และสร้างความน่าเชื่อถือ<ul><li><strong>AI สร้างบทความ:</strong> เลือกสไตล์ + สินค้าอ้างอิง แล้วกดสร้าง</li><li><strong>AI วาดภาพปก:</strong> สร้างรูปประกอบบทความด้วย Gemini AI</li><li><strong>SEO Tags:</strong> ตั้ง Title, Description, Keywords เพื่อให้ Google ค้นหาเจอ</li><li><strong>สถานะ:</strong> แบบร่าง (ไม่แสดงบนเว็บ) หรือ เผยแพร่ (แสดงทันที)</li><li><strong>FAQ:</strong> เพิ่มคำถามที่พบบ่อยท้ายบทความ ช่วยติดอันดับ Google</li></ul>" />
        </p>
      </div>
      <button @click="openNew" class="px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        เขียนบทความใหม่
      </button>
    </div>

    <!-- Tabs -->
    <div v-show="!showEditor" class="flex border-b border-gray-200 gap-6 mb-6">
      <button @click="activeMainTab='list'" class="pb-3 text-sm font-bold border-b-2 transition-all" :class="activeMainTab==='list'?'border-indigo-600 text-indigo-700':'border-transparent text-gray-500 hover:text-gray-700'">รายการบทความ</button>
      <button @click="activeMainTab='automation'" class="pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2" :class="activeMainTab==='automation'?'border-indigo-600 text-indigo-700':'border-transparent text-gray-500 hover:text-gray-700'">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        สร้างอัตโนมัติ (AI)
      </button>
    </div>

    <!-- Filters -->
    <div v-show="!showEditor && activeMainTab==='list'" class="flex flex-col sm:flex-row gap-3 mb-6">
      <input v-model="searchQuery" @input="onSearchInput" placeholder="ค้นหาบทความ..." class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
      <select v-model="filterStatus" @change="onFilterChange" class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white">
        <option value="all">ทั้งหมด</option>
        <option value="published">เผยแพร่แล้ว</option>
        <option value="draft">แบบร่าง</option>
      </select>
    </div>

    <!-- TAB: AUTOMATION -->
    <template v-if="activeMainTab==='automation' && !showEditor">
      <div v-if="loadingAutoArticle" class="flex items-center justify-center py-20"><div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div></div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 flex flex-col gap-6">
          <!-- Config Card -->
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-bold text-gray-900">สร้างบทความอัตโนมัติ</h3>
                <p class="text-sm text-gray-500 mt-1">ระบบจะสุ่มสินค้า 1 ชิ้นจากรายการที่เลือก แล้วให้ AI เขียนบทความ + สร้างรูปปก วันละ 1 บทความ</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="autoArticleConfig.enabled" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                <span class="ml-3 text-sm font-bold" :class="autoArticleConfig.enabled?'text-indigo-600':'text-gray-400'">{{ autoArticleConfig.enabled?'เปิดใช้งาน':'ปิด' }}</span>
              </label>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">เวลาที่สร้าง (ทุกวัน)</label>
                <input type="time" v-model="autoArticleConfig.time" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">สไตล์การเขียน</label>
                <select v-model="autoArticleConfig.style" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium">
                  <option value="educational">ให้ความรู้</option>
                  <option value="sales">ขายของ</option>
                  <option value="howto">วิธีใช้/ดูแล</option>
                  <option value="review">รีวิว</option>
                </select>
              </div>
            </div>
            <p v-if="autoArticleConfig.last_generated_date" class="text-xs text-gray-400 mb-4">สร้างล่าสุด: {{ autoArticleConfig.last_generated_date }}</p>
            <button @click="saveAutoArticleConfig" :disabled="savingAutoArticle" class="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              <svg v-if="savingAutoArticle" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ savingAutoArticle ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า' }}
            </button>
          </div>
          <!-- Product Selection -->
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex-1 flex flex-col min-h-[400px]">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold text-gray-900">สินค้าในระบบอัตโนมัติ ({{ (autoArticleConfig.product_ids||[]).length }} รายการ)</h3>
                <p class="text-sm text-gray-500 mt-1">เลือกสินค้าที่จะให้ระบบนำมาสุ่มสร้างบทความ</p>
              </div>
              <button @click="saveAutoArticleConfig" :disabled="savingAutoArticle" class="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                บันทึกสินค้า
              </button>
            </div>
            <div class="relative mb-4">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input v-model="autoProductSearch" type="text" placeholder="ค้นหาสินค้า..." class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            </div>
            <div class="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-2 max-h-[400px]">
              <div v-if="filteredAutoProducts.length===0" class="text-center py-10 text-gray-400 text-sm">ไม่พบสินค้า</div>
              <div v-for="p in filteredAutoProducts" :key="p.id" @click="toggleAutoProduct(p.id)" class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center border rounded-md transition-colors" :class="(autoArticleConfig.product_ids||[]).includes(p.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-transparent'">
                  <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                </div>
                <div class="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  <img v-if="p.image_url" :src="p.image_url" class="w-full h-full object-cover">
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-300"><svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg></div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gray-900 truncate">{{ p.name }}</p>
                  <p class="text-xs text-gray-500 truncate">{{ p.category }} · ฿{{ p.price }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Sidebar -->
        <div class="flex flex-col gap-4">
          <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
            <div class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-indigo-600">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">ทดสอบสร้างบทความ</h3>
            <p class="text-sm text-gray-600 mb-4">ระบบจะสุ่มสินค้า 1 ชิ้น ให้ AI เขียนบทความ + สร้างรูปปก แล้วบันทึกเป็นบทความเผยแพร่ทันที</p>
            <button @click="testAutoArticle" :disabled="testingAutoArticle" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              <svg v-if="testingAutoArticle" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ testingAutoArticle ? 'กำลังสร้างบทความ... (30-60 วินาที)' : 'ทดสอบสร้าง 1 บทความ' }}
            </button>
          </div>
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h4 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              วิธีการทำงาน
            </h4>
            <ul class="text-xs text-gray-500 space-y-2 list-disc pl-4">
              <li>ระบบจะทำงานวันละ 1 ครั้ง ตามเวลาที่ตั้งไว้</li>
              <li>สุ่มเลือกสินค้า 1 ชิ้น (วนลูปไม่ซ้ำ)</li>
              <li>AI จะเขียนเนื้อหาบทความ + สร้างรูปปก</li>
              <li>บทความจะถูกเผยแพร่อัตโนมัติ (สถานะ: Published)</li>
              <li>ยิ่งมีบทความมาก SEO ยิ่งแข็งแรง</li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="loading && activeMainTab==='list'" class="text-center py-20 text-gray-400">กำลังโหลด...</div>

    <!-- Article List -->
    <div v-else-if="!showEditor && activeMainTab==='list'" class="space-y-3">
      <div v-if="filteredArticles.length === 0" class="text-center py-20 text-gray-400">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
        <p class="font-bold">ยังไม่มีบทความ</p>
        <p class="text-sm mt-1">กด "เขียนบทความใหม่" เพื่อเริ่มต้น</p>
      </div>

      <div v-for="article in filteredArticles" :key="article.id" class="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow flex gap-5 items-start">
        <!-- Cover Image -->
        <div class="w-28 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img v-if="article.cover_image" :src="article.cover_image" class="w-full h-full object-cover">
          <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span :class="article.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'" class="text-[10px] font-bold px-2 py-0.5 rounded-full">
              {{ article.is_published ? 'เผยแพร่' : 'แบบร่าง' }}
            </span>
            <span v-if="article.is_featured" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
              <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg> 
              แนะนำ
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{{ article.category }}</span>
          </div>
          <h3 class="font-bold text-gray-900 truncate">{{ article.title }}</h3>
          <p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
            {{ formatDate(article.created_at) }} · <svg class="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> {{ article.view_count || 0 }} views
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 flex-shrink-0">
          <button @click="openEdit(article)" class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="แก้ไข">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button @click="deleteArticle(article)" :disabled="deletingId === article.id" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait" title="ลบ">
            <svg v-if="deletingId === article.id" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between mt-6 px-2">
        <p class="text-sm text-gray-400">ทั้งหมด {{ totalArticles }} บทความ · หน้า {{ currentPage }}/{{ totalPages }}</p>
        <div class="flex gap-1.5">
          <button @click="changePage(currentPage - 1)" :disabled="currentPage <= 1" class="px-3 py-1.5 text-sm font-bold rounded-lg border transition-colors" :class="currentPage <= 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">← ก่อนหน้า</button>
          <template v-for="p in paginationRange" :key="p">
            <span v-if="p === '...'" class="px-2 py-1.5 text-gray-400">…</span>
            <button v-else @click="changePage(p)" :class="currentPage === p ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'" class="w-9 h-9 text-sm font-bold rounded-lg border transition-colors">
              {{ p }}
            </button>
          </template>
          <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages" class="px-3 py-1.5 text-sm font-bold rounded-lg border transition-colors" :class="currentPage >= totalPages ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">ถัดไป →</button>
        </div>
      </div>
    </div>

    <!-- Article Editor -->
    <div v-if="showEditor" class="space-y-4">
      <button @click="showEditor = false" class="text-gray-500 hover:text-indigo-600 font-bold flex items-center gap-2 transition-colors">
         <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
         กลับไปหน้ารายการบทความ
      </button>
      
      <div class="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-lg font-black text-gray-900">{{ editingId ? 'แก้ไขบทความ' : 'เขียนบทความใหม่' }}</h2>
          <div class="flex items-center gap-3">
            <button @click="showEditor = false" class="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

      <div class="p-6 space-y-6">
        <!-- AI Generate Panel -->
        <div class="bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <h3 class="font-black text-gray-900 text-sm">สร้างบทความด้วย AI</h3>
          </div>

          <!-- Product Selection -->
          <div class="mb-5 relative">
            <label class="block text-xs font-bold text-gray-700 mb-2">เลือกสินค้าอ้างอิง (ไม่จำเป็น)</label>
            
            <div @click="showProductDropdown = !showProductDropdown" class="w-full border border-indigo-200 rounded-xl px-4 py-3 bg-white hover:border-indigo-400 cursor-pointer flex items-center justify-between transition-colors shadow-sm relative z-10">
              <div v-if="!currentAiProduct" class="text-sm text-gray-500 font-medium">— ไม่เลือก (ระบบจะเขียนบทความทั่วไป) —</div>
              <div v-else class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                  <img v-if="currentAiProduct.image_url" :src="currentAiProduct.image_url" class="w-full h-full object-cover">
                  <div v-else class="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                </div>
                <div>
                  <div class="text-sm font-bold text-gray-900 line-clamp-1">{{ currentAiProduct.name }}</div>
                  <div class="text-[10px] text-gray-500 font-medium">{{ currentAiProduct.category }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button v-if="currentAiProduct" @click.stop="aiProductId = ''; showProductDropdown = false" class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="ยกเลิกการเลือก">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                <svg class="w-5 h-5 text-gray-400" :class="{'rotate-180': showProductDropdown}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <!-- Fake Overlay to capture outside clicks -->
            <div v-if="showProductDropdown" @click="showProductDropdown = false" class="fixed inset-0 z-10"></div>

            <!-- Custom Dropdown Menu -->
            <div v-if="showProductDropdown" class="absolute top-[100%] left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-72 overflow-y-auto">
              <div @click="aiProductId = ''; showProductDropdown = false" class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors">
                <div class="text-sm text-gray-900 font-medium">— ไม่เลือก (เขียนทั่วไป) —</div>
              </div>
              
              <div v-if="productsList.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">
                ไม่มีข้อมูลสินค้า
              </div>

              <div v-for="p in productsList" :key="p.id" @click="aiProductId = p.id; showProductDropdown = false" 
                   class="px-4 py-3 hover:bg-indigo-50/50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                   :class="{'bg-indigo-50': aiProductId === p.id}">
                <div class="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                  <img v-if="p.image_url" :src="p.image_url" class="w-full h-full object-cover">
                  <div v-else class="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600">{{ p.name }}</div>
                  <div class="text-[10px] text-gray-500 mt-0.5 flex flex-wrap gap-1">
                    <span class="px-1.5 py-0.5 bg-gray-100 rounded-md font-medium">{{ p.category }}</span>
                    <span v-if="p.price" class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded-md font-bold">{{ Number(p.price).toLocaleString() }} ฿</span>
                  </div>
                </div>
                <div v-if="aiProductId === p.id" class="text-indigo-600">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Style Selection -->
          <div class="mb-5">
            <label class="block text-xs font-bold text-gray-700 mb-2">เลือกสไตล์บทความ</label>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button v-for="s in aiStyles" :key="s.id" @click="aiStyle = s.id" :class="aiStyle === s.id ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/20 shadow-xl shadow-indigo-100 scale-[1.02]' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:shadow-md'" class="border-2 rounded-2xl p-4 text-center transition-all duration-300 relative group">
                <div v-if="aiStyle === s.id" class="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white p-1 rounded-full shadow-md">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div v-html="s.svg" :class="{'scale-110 drop-shadow-sm': aiStyle === s.id}" class="transition-transform duration-300"></div>
                <div class="text-[12px] font-black" :class="aiStyle === s.id ? 'text-indigo-800' : 'text-gray-700'">{{ s.name }}</div>
                <div class="text-[10px] mt-1 font-medium text-gray-400 group-hover:text-gray-500 transition-colors">{{ s.desc }}</div>
              </button>
            </div>
          </div>

          <!-- Additional Prompt -->
          <div class="mb-4">
            <label class="block text-xs font-bold text-gray-600 mb-1.5">คำแนะนำเพิ่มเติม (ไม่จำเป็น)</label>
            <input v-model="aiPrompt" placeholder="เช่น เน้นเรื่องความทนทาน, เปรียบเทียบกับคู่แข่ง..." class="w-full border border-indigo-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400">
          </div>

          <!-- Generate Button -->
          <button @click="generateArticle" :disabled="generating" class="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
            <template v-if="generating">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              กำลังสร้างบทความ... (10-30 วินาที)
            </template>
            <template v-else>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> สร้างบทความด้วย AI
            </template>
          </button>
        </div>

        <!-- Title -->
        <div>
          <label class="block text-xs font-bold text-gray-700 mb-1.5">หัวข้อบทความ *</label>
          <input v-model="form.title" placeholder="เช่น วิธีเลือกบ้านเก็บของให้เหมาะกับพื้นที่" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
        </div>

        <!-- Gallery Unified Images -->
        <div class="col-span-full mt-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 mb-4 pb-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700">แกลเลอรีรูปภาพผลงาน (อัปโหลดและลากเพื่อสลับตำแหน่ง)</label>
                <p class="text-[10px] text-gray-500 mt-0.5">* รูปแรกจะถูกใช้เป็นรูปภาพหน้าปกโดยอัตโนมัติ</p>
              </div>
              <button @click="generateImagePrompt" :disabled="generatingPrompt" type="button" class="text-[11px] font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow shadow-indigo-200 px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 items-center">
                  <svg v-if="generatingPrompt" class="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  {{ generatingPrompt ? 'AI กำลังคิด Prompt...' : 'สร้าง Prompt ด้วย AI' }}
              </button>
            </div>
            
            <!-- Display AI Prompt -->
            <div class="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl relative group">
                <label class="block text-xs font-bold text-indigo-800 mb-2 flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Prompt (คำสั่ง) สำหรับวาดภาพหน้าปกด้วย AI (แก้ไขและบันทึกได้)
                </label>
                <textarea v-model="form.image_prompt" placeholder="เช่น A photorealistic image of..." class="w-full text-sm text-gray-700 bg-white border border-indigo-200 rounded-lg p-3 resize-y focus:ring-2 focus:ring-indigo-400 focus:outline-none" rows="2"></textarea>
                <button v-if="form.image_prompt" @click="copyPrompt" type="button" class="absolute top-4 right-4 text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-white rounded-md p-1.5 shadow-sm transition-colors" title="คัดลอก">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </button>
            </div>

            <draggable 
                v-model="allImages" 
                class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4" 
                item-key="index"
                :animation="250"
                ghost-class="opacity-50"
            >
                <template #header>
                    <div 
                        class="relative group rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50 transition-all duration-200 aspect-square flex flex-col items-center justify-center p-3 text-center cursor-pointer"
                        @dragover.prevent
                        @drop.prevent="handleImagesDrop"
                    >
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            @change="handleImagesUpload" 
                            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            :disabled="uploadingImages"
                        >
                        <template v-if="uploadingImages">
                            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mb-2"></div>
                            <span class="text-[10px] font-bold text-gray-500">กำลังอัปโหลด</span>
                        </template>
                        <template v-else>
                            <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-110 transition-transform">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            </div>
                            <div class="text-indigo-700 font-bold text-xs">เพิ่มรูปภาพ</div>
                        </template>
                    </div>
                </template>
                
                <template #item="{ element, index }">
                    <div class="relative group rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all bg-white aspect-square shadow-sm" :class="index === 0 ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-indigo-300'">
                        <img :src="element" class="w-full h-full object-cover">
                        
                        <div v-if="index === 0" class="absolute top-2 left-2 bg-indigo-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-sm z-10 pointer-events-none">
                            ภาพปก
                        </div>
                        <div v-else class="absolute top-2 left-2 bg-gray-900/60 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-sm z-10 pointer-events-none">
                            {{ index + 1 }}
                        </div>

                        <button @click.stop="removeImage(index)" type="button" class="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 hover:bg-red-500 hover:text-white rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100 z-20 tooltip" title="ลบรูปภาพ">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </template>
            </draggable>
        </div>

        <!-- Product Link + Category + Featured + Published -->
        <div class="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Product Link -->
            <div class="space-y-2 relative group z-10">
              <label class="text-[13px] font-bold text-gray-700 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                สินค้าอ้างอิง
              </label>
              <div class="relative">
                <div @click="showFormProductDropdown = !showFormProductDropdown" class="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white hover:border-indigo-400 cursor-pointer flex items-center justify-between transition-colors shadow-sm relative z-20">
                  <div v-if="!currentFormProduct" class="text-sm text-gray-500 font-medium">— ไม่เลือกสินค้า —</div>
                  <div v-else class="flex items-center gap-3 w-full pr-8">
                    <div class="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                      <img v-if="currentFormProduct.image_url" :src="currentFormProduct.image_url" class="w-full h-full object-cover">
                      <div v-else class="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                    </div>
                    <div class="overflow-hidden flex-1 min-w-0 flex flex-col justify-center text-left">
                      <div class="text-sm font-bold text-gray-900 truncate w-full">{{ currentFormProduct.name }}</div>
                      <div class="text-[10px] text-gray-500 font-medium truncate w-full">{{ currentFormProduct.category }}</div>
                    </div>
                  </div>
                  <div class="absolute right-3 flex items-center gap-2">
                    <button v-if="currentFormProduct" @click.stop="form.product_id = null; showFormProductDropdown = false" class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="ยกเลิกการเลือก">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                    <svg class="w-5 h-5 text-gray-400" :class="{'rotate-180': showFormProductDropdown}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>

                <!-- Fake Overlay to capture outside clicks -->
                <div v-if="showFormProductDropdown" @click="showFormProductDropdown = false" class="fixed inset-0 z-10 w-full h-full"></div>

                <!-- Custom Dropdown Menu -->
                <div v-if="showFormProductDropdown" class="absolute top-[100%] left-0 w-full sm:w-[400px] mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-30 max-h-72 overflow-y-auto">
                  <div @click="form.product_id = null; showFormProductDropdown = false" class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors">
                    <div class="text-sm text-gray-900 font-medium">— ไม่เลือกสินค้า —</div>
                  </div>
                  
                  <div v-if="productsList.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">
                    ไม่มีข้อมูลสินค้า
                  </div>

                  <div v-for="p in productsList" :key="p.id" @click="form.product_id = p.id; showFormProductDropdown = false" 
                       class="px-4 py-3 hover:bg-indigo-50/50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                       :class="{'bg-indigo-50': form.product_id === p.id}">
                    <div class="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                      <img v-if="p.image_url" :src="p.image_url" class="w-full h-full object-cover">
                      <div v-else class="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 truncate">{{ p.name }}</div>
                      <div class="text-[10px] text-gray-500 mt-0.5 flex flex-wrap gap-1">
                        <span class="px-1.5 py-0.5 bg-gray-100 rounded-md font-medium">{{ p.category }}</span>
                        <span v-if="p.price" class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded-md font-bold">{{ Number(p.price).toLocaleString() }} ฿</span>
                      </div>
                    </div>
                    <div v-if="form.product_id === p.id" class="text-indigo-600">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Category -->
            <div class="space-y-2 relative group">
              <label class="text-[13px] font-bold text-gray-700 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                หมวดหมู่
              </label>
              <div class="relative">
                <select v-model="form.category" class="w-full appearance-none border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm bg-white hover:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700 cursor-pointer shadow-sm shadow-gray-100/50">
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-hover:text-indigo-500 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
                </div>
              </div>
            </div>
            
            <!-- Author -->
            <div class="space-y-2 relative group">
              <label class="text-[13px] font-bold text-gray-700 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                ผู้เขียน
              </label>
              <input v-model="form.author" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white hover:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700 shadow-sm shadow-gray-100/50" placeholder="ชื่อผู้เขียน">
            </div>
          </div>

          <!-- Status Toggles -->
          <div class="pt-4 border-t border-gray-100 space-y-3">
            <label class="text-[13px] font-bold text-gray-700 flex items-center gap-1.5">ตั้งค่าการแสดงผล</label>
            <div class="flex flex-wrap gap-4">
              <!-- Publish button toggle -->
              <label class="w-48 flex flex-col items-center justify-center p-2.5 border rounded-xl cursor-pointer transition-all" :class="form.is_published ? 'bg-emerald-50 border-emerald-300 shadow-emerald-100 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'">
                <div class="flex items-center gap-2 w-full justify-between">
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" :class="form.is_published ? 'text-emerald-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    <span class="text-[13px] font-bold" :class="form.is_published ? 'text-emerald-700' : 'text-gray-600'">เผยแพร่</span>
                  </div>
                  <div class="relative inline-block w-8 outline-none z-0">
                    <input type="checkbox" v-model="form.is_published" class="sr-only">
                    <div class="block w-8 h-4 rounded-full transition-colors" :class="form.is_published ? 'bg-emerald-500' : 'bg-gray-300'"></div>
                    <div class="dot absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform" :class="form.is_published ? 'transform translate-x-4' : ''"></div>
                  </div>
                </div>
              </label>

              <!-- Featured button toggle -->
              <label class="w-48 flex flex-col items-center justify-center p-2.5 border rounded-xl cursor-pointer transition-all" :class="form.is_featured ? 'bg-amber-50 border-amber-300 shadow-amber-100 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'">
                <div class="flex items-center gap-2 w-full justify-between">
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" :class="form.is_featured ? 'text-amber-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg> 
                    <span class="text-[13px] font-bold" :class="form.is_featured ? 'text-amber-700' : 'text-gray-600'">แนะนำ</span>
                  </div>
                  <div class="relative inline-block w-8 outline-none z-0">
                    <input type="checkbox" v-model="form.is_featured" class="sr-only">
                    <div class="block w-8 h-4 rounded-full transition-colors" :class="form.is_featured ? 'bg-amber-500' : 'bg-gray-300'"></div>
                    <div class="dot absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform" :class="form.is_featured ? 'transform translate-x-4' : ''"></div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Excerpt -->
        <div>
          <label class="block text-xs font-bold text-gray-700 mb-1.5">เนื้อหาย่อ (แสดงในหน้ารายการ)</label>
          <textarea v-model="form.excerpt" rows="2" placeholder="สรุปสั้นๆ 2-3 บรรทัด..." class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500"></textarea>
        </div>

        <!-- Content (CKEditor) -->
        <div>
          <label class="block text-xs font-bold text-gray-700 mb-1.5">เนื้อหาบทความ</label>
          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <Ckeditor :editor="editor" v-model="form.content" :config="editorConfig" />
          </div>
        </div>

        <!-- Additional Context (LLM) & FAQ -->
        <div class="border border-indigo-100 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div class="bg-indigo-50/80 px-5 py-4 border-b border-indigo-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-sm">ข้อมูลเสริมสำหรับ AI & คำถามที่พบบ่อย (FAQ)</h3>
                <p class="text-xs text-gray-500 mt-0.5">เพิ่ม Context ให้ AI นำไปวิเคราะห์ และตั้ง FAQ เพื่อ SEO Snippet</p>
              </div>
            </div>
            <button @click.prevent="generateAllAiData" :disabled="generatingAll" class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-200 disabled:opacity-50 group">
              <svg v-if="generatingAll" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <svg v-else class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              {{ generatingAll ? 'กำลังวิเคราะห์ข้อมูลทั้งหมด...' : 'สร้าง SEO & AI ทั้งหมดอัตโนมัติ' }}
            </button>
          </div>
          <div class="p-5 space-y-6">
            <!-- LLM Context -->
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>LLM Context (ข้อความบริบทสำหรับ AI)</span>
              </label>
              <textarea v-model="form.llm_context" placeholder="เช่น ใส่ข้อมูลเบื้องหลัง, คีย์เวิร์ดพิเศษ, แนวทางที่อยากให้ AI โฟกัสเวลานำข้อมูลนี้ไปตอบคำถาม..." rows="3" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-y focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-700 bg-gray-50 hover:bg-white focus:bg-white"></textarea>
              <p class="text-[10px] text-gray-500 mt-1.5">* ข้อมูลนี้เป็นข้อมูลซ่อน จะถูกดึงไปใช้เวลา AI มาประมวลผลหน้านี้เท่านั้น</p>
            </div>

            <!-- FAQ List -->
            <div class="pt-4 border-t border-gray-100">
              <div class="flex items-center justify-between mb-3">
                <label class="block text-xs font-bold text-gray-700">FAQ (คำถามที่พบบ่อย)</label>
                <div class="flex items-center gap-2">
                  <button type="button" @click.prevent="generateFaq" :disabled="generatingFaq" class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold transition-colors">
                    <svg v-if="generatingFaq" class="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    {{ generatingFaq ? 'กำลังดึงคำถามโดย AI...' : 'ให้ AI ช่วยคิด FAQ' }}
                  </button>
                  <button type="button" @click.prevent="addFaq" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[11px] font-bold hover:bg-gray-200 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    เพิ่มคำถามเอง
                  </button>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="!form.faq || form.faq.length === 0" class="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p class="text-sm text-gray-500 font-medium">ยังไม่มีคำถามที่พบบ่อย</p>
                <p class="text-xs text-gray-400 mt-1">ให้ AI ช่วยคิด หรือเลือกเพิ่มด้วยตัวเอง</p>
              </div>

              <!-- List -->
              <div v-else class="space-y-3">
                <div v-for="(item, idx) in form.faq" :key="idx" class="relative group bg-white border border-gray-200 rounded-xl p-4 pt-5 shadow-sm hover:border-indigo-300 transition-colors">
                  <div class="absolute -top-3 left-4 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">คำถามที่ {{ idx + 1 }}</div>
                  <button type="button" @click.prevent="removeFaq(idx)" class="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors tooltip" title="ลบคำถามนี้">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  
                  <div class="space-y-3 mt-1">
                    <div>
                      <input v-model="item.question" placeholder="คำถาม..." class="w-full border-b border-gray-200 px-1 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors bg-transparent placeholder-gray-400">
                    </div>
                    <div>
                      <textarea v-model="item.answer" placeholder="คำตอบ..." rows="2" class="w-full border-b border-gray-200 px-1 py-1.5 text-sm text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none bg-transparent placeholder-gray-400"></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SEO -->
        <div class="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div class="bg-gray-50/80 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-sm">ตั้งค่า SEO เสริมการค้นหา</h3>
                <p class="text-xs text-gray-500 mt-0.5">ปรับแต่งข้อมูลให้ถูกใจ Google (ไม่บังคับ)</p>
              </div>
            </div>
            <button @click.prevent="generateAllAiData" :disabled="generatingAll" class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-200 disabled:opacity-50 group">
              <svg v-if="generatingAll" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <svg v-else class="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              {{ generatingAll ? 'กำลังวิเคราะห์...' : 'ให้ AI ช่วยคิด SEO' }}
            </button>
          </div>
          <div class="p-5 space-y-4">
            <!-- SEO Title -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold text-gray-700">SEO Title (หัวข้อบน Google)</label>
                <span class="text-[10px] font-medium" :class="form.seo_title.length > 60 ? 'text-red-500' : 'text-gray-400'">{{ form.seo_title.length }}/60</span>
              </div>
              <input v-model="form.seo_title" placeholder="ใส่หัวข้อที่ดึงดูด น่าคลิก" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700" :class="{'border-red-300 focus:ring-red-500/20 focus:border-red-500': form.seo_title.length > 60}">
            </div>

            <!-- SEO Description -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold text-gray-700">SEO Description (คำบรรยายบน Google)</label>
                <span class="text-[10px] font-medium" :class="form.seo_description.length > 160 ? 'text-red-500' : 'text-gray-400'">{{ form.seo_description.length }}/160</span>
              </div>
              <textarea v-model="form.seo_description" placeholder="สรุปเนื้อหาสั้นๆ ให้น่าติดตาม มีคีย์เวิร์ดสำคัญ" rows="2" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 resize-none" :class="{'border-red-300 focus:ring-red-500/20 focus:border-red-500': form.seo_description.length > 160}"></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- SEO Keywords -->
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1.5">SEO Keywords</label>
                <input v-model="form.seo_keywords" placeholder="เช่น บ้านเก็บของ, สวนหน้าบ้าน (คั่นด้วยคอมม่า)" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700">
              </div>
              
              <!-- Tags -->
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1.5">บทความในเว็บ Tags</label>
                <input v-model="form.tags" placeholder="เช่น โปรโมชัน, ความรู้ (คั่นด้วยคอมม่า)" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700">
              </div>
            </div>

            <!-- Previews -->
            <div v-if="form.seo_title || form.seo_description" class="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">ตัวอย่างผลลัพธ์บน Google</div>
              <div class="text-[#1a0dab] text-lg font-medium hover:underline cursor-pointer truncate">{{ form.seo_title || form.title || 'ชื่อหัวข้อบทความ' }}</div>
              <div class="text-[#006621] text-xs font-medium truncate mb-1">yoursite.com > blog > {{ form.slug || 'slug' }}</div>
              <div class="text-[#545454] text-xs line-clamp-2 leading-relaxed">{{ form.seo_description || form.excerpt || 'คำบรรยายสรุปเนื้อหาบทความแบบย่อ...' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save -->
      <div class="sticky bottom-0 bg-white z-40 p-6 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        <button @click="showEditor = false" class="px-6 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
        <button @click="save" :disabled="saving" class="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200">
          {{ saving ? 'กำลังบันทึก...' : (editingId ? 'อัปเดตบทความ' : 'เผยแพร่บทความ') }}
        </button>
      </div>
    </div>
  </div>
  </div>
</template>


