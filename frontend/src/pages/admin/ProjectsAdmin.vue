<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import { ClassicEditor, Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo, Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed, BlockQuote } from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'
import { apiFetch } from '../../utils/apiFetch'
import { useNotifications } from '../../composables/useNotifications'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()
const { showConfirm } = useConfirm()
const notifications = useNotifications()
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
        uploadUrl: `${import.meta.env.VITE_API_URL || ''}/api/upload/ckeditor`,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
    }
})

const projects = ref([])
const productsList = ref([]) // สำหรับ Dropdown เลือกสินค้า
const loading = ref(true)

// Active states for UI feedback
const deletingId = ref(null)

// Filters & Pagination State
const searchQuery = ref('')
const filterStatus = ref('all') // 'all', 'published', 'hidden'
const currentPage = ref(1)
const itemsPerPage = ref(12)

const filteredProjects = computed(() => {
    let result = projects.value

    if (filterStatus.value === 'published') {
        result = result.filter(p => p.is_published)
    } else if (filterStatus.value === 'hidden') {
        result = result.filter(p => !p.is_published)
    }

    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter(p => 
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.client_name && p.client_name.toLowerCase().includes(q)) ||
            (p.location && p.location.toLowerCase().includes(q))
        )
    }

    return result
})

const totalPages = computed(() => {
    if (itemsPerPage.value === 'all') return 1
    return Math.ceil(filteredProjects.value.length / itemsPerPage.value) || 1
})

const paginatedProjects = computed(() => {
    if (itemsPerPage.value === 'all') return filteredProjects.value
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + (typeof itemsPerPage.value === 'number' ? itemsPerPage.value : filteredProjects.value.length)
    return filteredProjects.value.slice(start, end)
})


watch([searchQuery, filterStatus, itemsPerPage], () => {
    currentPage.value = 1
})

// Product Picker Modal State
const showProductModal = ref(false)
const productSearchQuery = ref('')
const selectedCategory = ref('all')

const productCategories = computed(() => {
    const cats = new Set()
    productsList.value.forEach(p => {
        if (p.category) cats.add(p.category)
    })
    return Array.from(cats).sort()
})

const filteredProducts = computed(() => {
    const lowerQuery = (productSearchQuery.value || '').toLowerCase()
    let result = productsList.value

    // Filter by category
    if (selectedCategory.value !== 'all') {
        result = result.filter(p => p.category === selectedCategory.value)
    }

    // Filter by search query
    if (lowerQuery) {
        result = result.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) || 
            (p.sku && p.sku.toLowerCase().includes(lowerQuery)) ||
            (p.category && p.category.toLowerCase().includes(lowerQuery))
        )
    }
    return result
})

const selectedProductDetails = computed(() => {
    if (!currentProject.value.product_id) return null
    return productsList.value.find(p => p.id === currentProject.value.product_id) || null
})

const openProductModal = () => {
    productSearchQuery.value = ''
    selectedCategory.value = 'all'
    showProductModal.value = true
}

const selectProduct = (prod) => {
    currentProject.value.product_id = prod.id
    productSearchQuery.value = ''
    showProductModal.value = false
}

const clearSelectedProduct = () => {
    currentProject.value.product_id = ''
}

// Form State
const isEditing = ref(false)
const showForm = ref(false)
const aiGenerating = ref(false)
const aiPrompt = ref('')
const selectedAiStyle = ref('Professional')
const aiStyles = [
  { value: 'Professional', label: 'ทางการ (Professional)' },
  { value: 'Friendly', label: 'เป็นกันเอง (Friendly/Casual)' },
  { value: 'Sales', label: 'เน้นขายของ (Sales-focused)' },
  { value: 'Storytelling', label: 'เล่าเรื่อง (Storytelling)' }
]
const isSaving = ref(false) // เพื่อควบคุมสถานะปุ่มบันทึก

const uploadingImages = ref(false)
const allImages = ref([])
const currentProject = ref({
  id: null,
  title: '',
  description: '',
  client_name: '',
  location: '',
  cover_image: '',
  gallery_images: [],
  content_rich: '',
  is_published: true,
  product_id: '',
  service_date: '' // เพิ่มฟิลด์ให้รองรับวันที่ให้บริการ
})

const fetchProjects = async () => {
    loading.value = true
    try {
        const [projRes, prodRes] = await Promise.all([
            apiFetch('/api/projects'),
            apiFetch('/api/products?is_active=1') // ดึงรายการสินค้ามาแสดงใน Dropdown
        ])
        
        const projData = await projRes.json()
        const prodData = await prodRes.json()

        if (projData.success) {
            projects.value = projData.data
        }
        if (prodData.success) {
            productsList.value = prodData.data
        }
    } catch (error) {
        console.error('Fetch data failed', error)
        showToast('โหลดข้อมูลโปรเจคหรือสินค้าไม่สำเร็จ', 'error')
    } finally {
        loading.value = false
    }
}

const generateWithAI = async () => {
    if (!aiPrompt.value) {
        showToast('กรุณาระบุข้อมูลผลงานสั้นๆ ก่อนให้ AI สร้างเนื้อหา', 'error')
        return
    }

    aiGenerating.value = true
    try {
        const res = await apiFetch('/api/ai/generate-project', {
            method: 'POST',
            body: JSON.stringify({ prompt: aiPrompt.value, style: selectedAiStyle.value })
        })
        const result = await res.json()

        if (result.success && result.data) {
            const d = result.data
            if (d.title) currentProject.value.title = d.title
            if (d.client_name) currentProject.value.client_name = d.client_name
            if (d.location) currentProject.value.location = d.location
            if (d.description) currentProject.value.description = d.description
            if (d.content_rich) currentProject.value.content_rich = d.content_rich
            if (d.service_date) currentProject.value.service_date = d.service_date
            if (d.product_id) {
                currentProject.value.product_id = d.product_id
                showToast('AI พบคู่สินค้าที่ตรงกันและจับคู่ให้แล้ว!', 'success')
            } else {
                showToast('AI สร้างเนื้อหาสำเร็จ แต่ไม่พบชื่อสินค้าที่ตรงกันในระบบ', 'success')
            }
        } else {
            showToast('ไม่สามารถสร้างเนื้อหาได้: ' + (result.error || 'Unknown Error'), 'error')
        }
    } catch (error) {
        console.error('AI Generation Error:', error)
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI', 'error')
    } finally {
        aiGenerating.value = false
    }
}

onMounted(() => {
    fetchProjects()
})

const editProject = (proj) => {
    currentProject.value = JSON.parse(JSON.stringify(proj)) // deep copy
    
    // Fix null values
    currentProject.value.title = currentProject.value.title || '';
    currentProject.value.description = currentProject.value.description || '';
    currentProject.value.client_name = currentProject.value.client_name || '';
    currentProject.value.location = currentProject.value.location || '';
    currentProject.value.content_rich = currentProject.value.content_rich || '';
    currentProject.value.product_id = currentProject.value.product_id || '';
    currentProject.value.badge_size = currentProject.value.badge_size || '';
    currentProject.value.badge_tag = currentProject.value.badge_tag || '';
    
    // Fix boolean for checkbox Vue v-model
    currentProject.value.is_published = currentProject.value.is_published === 1 || currentProject.value.is_published === true || currentProject.value.is_published === '1';
    
    // ตัดเอาเฉพาะส่วน YYYY-MM-DD เพื่อให้แสดงผลใน <input type="date"> ได้อย่างถูกต้อง
    if (currentProject.value.service_date) {
        if (typeof currentProject.value.service_date === 'string' && currentProject.value.service_date.includes('T')) {
            currentProject.value.service_date = currentProject.value.service_date.split('T')[0];
        } else if (typeof currentProject.value.service_date === 'string') {
            try {
                currentProject.value.service_date = new Date(currentProject.value.service_date).toISOString().split('T')[0];
            } catch(e) {}
        }
    }
    
    // Populate unified images array
    const arr = []
    if (currentProject.value.cover_image) arr.push(currentProject.value.cover_image)
    if (Array.isArray(currentProject.value.gallery_images)) arr.push(...currentProject.value.gallery_images)
    allImages.value = arr.filter(Boolean)

    isEditing.value = true
    showForm.value = true
    aiPrompt.value = '' // reset prompt
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const createNewProject = () => {
    currentProject.value = {
        id: null,
        title: '',
        description: '',
        client_name: '',
        location: '',
        cover_image: '',
        gallery_images: [],
        content_rich: '',
        is_published: true,
        product_id: '',
        service_date: '',
        badge_size: '',
        badge_tag: ''
    }
    allImages.value = []
    isEditing.value = false
    showForm.value = true
    aiPrompt.value = '' // reset prompt
}

const cancelForm = () => {
    showForm.value = false
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
      // Handle both imageUrl (from old syntax) and url (from new syntax)
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

const saveProject = async () => {
    if (!currentProject.value.title) {
        showToast('กรุณากรอกชื่อผลงาน', 'error')
        return
    }

    if (allImages.value.length > 0) {
        currentProject.value.cover_image = allImages.value[0]
        currentProject.value.gallery_images = allImages.value.slice(1)
    } else {
        currentProject.value.cover_image = ''
        currentProject.value.gallery_images = []
    }

    try {
        isSaving.value = true
        const url = isEditing.value ? `/api/projects/${currentProject.value.id}` : '/api/projects'
        const method = isEditing.value ? 'PUT' : 'POST'

        const res = await apiFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentProject.value)
        })

        const data = await res.json()
        if (data.success) {
            showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success')
            showForm.value = false
            fetchProjects()
        } else {
            showToast('บันทึกไม่สำเร็จ: ' + data.error, 'error')
        }
    } catch (error) {
        console.error('Save Project Error:', error)
        showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error')
    } finally {
        isSaving.value = false
    }
}

const deleteProject = async (id) => {
    if (deletingId.value) return // Prevent double delete
    
    const isConfirmed = await showConfirm({
        title: 'ยืนยันการลบผลงาน',
        message: 'ผลงานที่ถูกลบจะไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่ที่จะลบ?',
        confirmText: 'ลบผลงาน',
        cancelText: 'ยกเลิก',
        type: 'danger'
    })
    
    if (!isConfirmed) return

    deletingId.value = id
    try {
        const res = await apiFetch(`/api/projects/${id}`, {
            method: 'DELETE'
        })
        const data = await res.json()
        if (data.success) {
            showToast('ลบผลงานเรียบร้อยแล้ว', 'success')
            fetchProjects()
        } else {
            showToast('ลบไม่สำเร็จ: ' + data.error, 'error')
        }
    } catch (error) {
        console.error('Delete Project Error:', error)
        showToast('เกิดข้อผิดพลาดในการลบ', 'error')
    } finally {
        deletingId.value = null
    }
}

// Ensure full URL for images stored as relative paths
const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_API_URL || ''}${path}`
}

const getProductImage = (prod) => {
    if (!prod) return '';
    if (prod.image_url) return getImageUrl(prod.image_url);
    if (prod.images) {
        try {
            const parsed = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
            if (Array.isArray(parsed) && parsed.length > 0) {
                return getImageUrl(parsed[0]);
            }
        } catch (e) {
            console.error('Failed to parse product images', e);
        }
    }
    return '';
}

</script>

<template>
  <div class="max-w-7xl mx-auto pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">จัดการหน้าผลงาน (Projects)</h1>
        <p class="text-gray-500 mt-2 font-medium flex items-center gap-1">เพิ่ม ลบ หรือแก้ไขข้อมูลผลงานการติดตั้งและจัดส่ง
          <InfoTooltip title="หน้าผลงานคืออะไร?" description="หน้านี้แสดงผลงานจริง (Portfolio) เพื่อสร้างความเชื่อมั่น<ul><li><strong>AI เขียนเนื้อหา:</strong> พิมพ์โน้ตสั้นๆ AI จะเรียบเรียงเป็นบทความเต็มรูปแบบ</li><li><strong>อ้างอิงสินค้า:</strong> ผูกผลงานกับสินค้าในระบบ AI ช่วยจับคู่อัตโนมัติ</li><li><strong>รูปแกลเลอรี:</strong> รูปแรกคือปก ลากสลับลำดับได้</li><li><strong>สถานะ:</strong> เผยแพร่/ซ่อน ควบคุมการแสดงบนหน้าเว็บ</li></ul>" />
        </p>
      </div>
      <button 
        v-if="!showForm"
        @click="createNewProject"
        class="flex items-center px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
      >
        <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        เพิ่มผลงานใหม่
      </button>
    </div>

    <!-- MAIN FORM VIEW -->
    <div v-if="showForm" class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 mb-10 transition-all">
        <div class="px-8 py-6 border-b border-gray-100 bg-gray-50 rounded-t-3xl flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">{{ isEditing ? 'แก้ไขผลงาน' : 'สร้างผลงานใหม่' }}</h2>
            <button @click="cancelForm" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">ย้อนกลับ</button>
        </div>

        <div class="p-8 space-y-10">
            <!-- AI Assistant Block -->
            <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden mb-6 relative">
              <div v-if="aiGenerating" class="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <svg class="animate-spin h-8 w-8 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-indigo-900 font-bold">AI กำลังเขียนเนื้อหาขยายความให้ผลงานชิ้นนี้...</p>
                <p class="text-sm text-indigo-600 mt-1">ใช้เวลาประมาณ 10-15 วินาที</p>
              </div>

              <div class="p-6 border-b border-indigo-100/50">
                <h2 class="text-lg font-bold text-indigo-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  ผู้ช่วย AI เขียนเนื้อหาหน้าผลงาน
                </h2>
                <p class="text-sm text-indigo-700 mt-1">ช่างเพียงแค่พิมพ์โน้ตสั้นๆ (เช่น วันที่ สถานที่ ชื่อรุ่น) AI จะนำไปเรียบเรียงและขอบคุณลูกค้าให้อย่างเป็นมืออาชีพ</p>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-sm font-bold text-indigo-900 mb-2">
                    ข้อมูลจากช่างหน้างาน (พิมพ์สั้นๆ ได้เลย)
                  </label>
                  <textarea v-model="aiPrompt" rows="3" placeholder="เช่น '18 ก.พ. 2569 / นิคมอุตสาหกรรมบางปะอิน จ.อยุธยา ส่งมอบและติดตั้งเครื่องตัดปอกสายไฟ KODERA C371G พร้อมทดสอบการทำงาน'" class="w-full border border-indigo-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white mb-4"></textarea>

                  <label class="block text-sm font-bold text-indigo-900 mb-2">
                    สไตล์การเขียนเนื้อหา
                  </label>
                  <select v-model="selectedAiStyle" class="border border-indigo-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 w-full sm:w-auto">
                    <option v-for="style in aiStyles" :key="style.value" :value="style.value">{{ style.label }}</option>
                  </select>
                </div>
                
                <div class="flex items-center justify-end">
                  <button type="button" @click="generateWithAI" :disabled="aiGenerating || !aiPrompt" class="shrink-0 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    สร้างเนื้อหาด้วย AI ทันที
                  </button>
                </div>
              </div>
            </div>

            <!-- Details Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-900 mb-2">ชื่อผลงาน / หัวข้อ</label>
                        <input v-model="currentProject.title" type="text" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 max-w-lg transition-colors" placeholder="เช่น ก่อสร้างอาคารโกดังสินค้า..."/>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-900 mb-2">ชื่อลูกค้า / บริษัท</label>
                        <input v-model="currentProject.client_name" type="text" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 max-w-lg transition-colors" placeholder="เช่น บริษัท เจริญภัณฑ์ จำกัด"/>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-900 mb-2">สถานที่ / จังหวัด</label>
                        <input v-model="currentProject.location" type="text" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 max-w-lg transition-colors" placeholder="เช่น พระราม 3, กรุงเทพมหานคร"/>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-900 mb-2">วันที่ให้บริการ (ถ้ามี)</label>
                        <input v-model="currentProject.service_date" type="date" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 max-w-lg transition-colors"/>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-900 mb-2">ขนาดผลงาน (แสดงมุมซ้ายบนการ์ด)</label>
                        <input v-model="currentProject.badge_size" type="text" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 max-w-lg transition-colors" placeholder="เช่น ขนาด 2.77 x 1.91 x 2.02 เมตร"/>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-900 mb-2">ป้ายกำกับ (แสดงมุมขวาบนการ์ด)</label>
                        <input v-model="currentProject.badge_tag" type="text" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 max-w-lg transition-colors" placeholder="เช่น รุ่นยอดนิยม"/>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-900 mb-2 flex items-center justify-between">
                           อ้างอิงสินค้า (ถ้ามี)
                        </label>
                        
                        <!-- Selected Product Card -->
                        <div v-if="selectedProductDetails" class="relative group bg-white border border-emerald-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all max-w-lg">
                            <img :src="getProductImage(selectedProductDetails)" class="w-16 h-16 object-cover rounded-xl bg-gray-50 border border-gray-100 shrink-0">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-bold text-gray-900 truncate">{{ selectedProductDetails.name }}</h4>
                                <p class="text-xs text-emerald-600 font-medium mt-0.5">SKU: {{ selectedProductDetails.sku || 'N/A' }}</p>
                            </div>
                            <button @click="clearSelectedProduct" type="button" class="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0" title="ยกเลิกการผูกสินค้า">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>

                        <!-- Open Product Picker Button -->
                        <button v-else @click="openProductModal" type="button" class="w-full max-w-lg flex items-center gap-3 px-4 py-3.5 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-2xl transition-all duration-200 group cursor-pointer">
                            <div class="w-10 h-10 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center text-emerald-600 transition-colors shrink-0">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                            </div>
                            <div class="text-left">
                                <p class="text-sm font-bold text-gray-700 group-hover:text-emerald-700">คลิกเพื่อเลือกสินค้า</p>
                                <p class="text-xs text-gray-400 group-hover:text-emerald-500">ค้นหาและเลือกจากรายการสินค้าทั้งหมด</p>
                            </div>
                            <svg class="w-5 h-5 text-gray-300 group-hover:text-emerald-500 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </button>

                        <p class="text-xs text-gray-400 mt-2">AI สามารถช่วยค้นหาเลือกให้ได้หากช่างระบุชื่อรุ่นในโน้ตด้านบน</p>

                        <!-- ═══ Product Picker Modal ═══ -->
                        <teleport to="body">
                          <div v-if="showProductModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <!-- Backdrop -->
                            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showProductModal = false"></div>
                            
                            <!-- Modal Content -->
                            <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 animate-[modalIn_0.3s_ease-out]">
                              <!-- Header -->
                              <div class="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 shrink-0">
                                <div class="flex items-center justify-between mb-4">
                                  <div class="flex items-center gap-3">
                                    <div class="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                    </div>
                                    <div>
                                      <h3 class="text-lg font-black text-gray-900">เลือกสินค้า</h3>
                                      <p class="text-xs text-gray-500">{{ productsList.length }} สินค้าในระบบ</p>
                                    </div>
                                  </div>
                                  <button @click="showProductModal = false" type="button" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                  </button>
                                </div>
                                <!-- Search -->
                                <div class="relative">
                                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                  </div>
                                  <input v-model="productSearchQuery" type="text" class="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block pl-11 p-3.5 shadow-sm" placeholder="ค้นหาชื่อสินค้า, SKU หรือหมวดหมู่..." autofocus />
                                </div>
                                <!-- Category Filter -->
                                <div v-if="productCategories.length > 0" class="flex flex-wrap gap-1.5 mt-3">
                                  <button @click="selectedCategory = 'all'" type="button" :class="['px-3 py-1.5 text-xs font-bold rounded-lg transition-all', selectedCategory === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600']">
                                    ทั้งหมด ({{ productsList.length }})
                                  </button>
                                  <button v-for="cat in productCategories" :key="cat" @click="selectedCategory = cat" type="button" :class="['px-3 py-1.5 text-xs font-bold rounded-lg transition-all', selectedCategory === cat ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600']">
                                    {{ cat }} ({{ productsList.filter(p => p.category === cat).length }})
                                  </button>
                                </div>
                              </div>

                              <!-- Product Grid -->
                              <div class="flex-1 overflow-y-auto p-4">
                                <div v-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
                                  <svg class="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                  <p class="font-bold">ไม่พบสินค้าที่ค้นหา</p>
                                  <p class="text-sm mt-1">ลองเปลี่ยนคำค้นหาใหม่</p>
                                </div>
                                <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                  <button 
                                    v-for="prod in filteredProducts" 
                                    :key="prod.id" 
                                    @click="selectProduct(prod)" 
                                    type="button" 
                                    :class="['text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group', currentProject.product_id === prod.id ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50' : 'border-gray-100 hover:border-emerald-300 bg-white']"
                                  >
                                    <div class="aspect-square bg-gray-50 overflow-hidden relative">
                                      <img :src="getProductImage(prod)" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                                      <div v-if="currentProject.product_id === prod.id" class="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                        <div class="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="p-2.5">
                                      <h4 class="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">{{ prod.name }}</h4>
                                      <div class="flex items-center justify-between mt-1.5">
                                        <span class="text-[10px] text-gray-400 font-medium">{{ prod.sku || 'N/A' }}</span>
                                        <span v-if="prod.price" class="text-[10px] font-black text-emerald-600">฿{{ Number(prod.price).toLocaleString() }}</span>
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              </div>

                              <!-- Footer -->
                              <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                                <p class="text-xs text-gray-400">แสดง {{ filteredProducts.length }} สินค้า</p>
                                <button @click="showProductModal = false" type="button" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">ปิด</button>
                              </div>
                            </div>
                          </div>
                        </teleport>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-900 mb-2">แสดงออนไลน์?</label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" v-model="currentProject.is_published" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            <span class="ml-3 text-sm font-medium text-gray-500">{{ currentProject.is_published ? 'แสดงผล' : 'ซ่อน' }}</span>
                        </label>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-900 mb-2">คำอธิบายสั้นๆ (Description)</label>
                        <textarea v-model="currentProject.description" rows="3" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 max-w-lg transition-colors" placeholder="สรุปรายละเอียดงานสั้นๆ..."></textarea>
                    </div>
                </div>

                <div class="space-y-8">
                    <!-- Gallery Unified Images -->
                    <div>
                        <label class="block text-sm font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">แกลเลอรีรูปภาพผลงาน (อัปโหลดและลากเพื่อสลับตำแหน่ง)</label>
                        <p class="text-xs text-gray-500 mb-4">* รูปแรกจะถูกใช้เป็นรูปภาพหน้าปกโดยอัตโนมัติ</p>
                        
                        <draggable 
                            v-model="allImages" 
                            class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4" 
                            item-key="index"
                            :animation="250"
                            ghost-class="opacity-50"
                        >
                            <template #header>
                                <div 
                                    class="relative group rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-400 bg-gray-50 hover:bg-emerald-50 transition-all duration-200 aspect-square flex flex-col items-center justify-center p-3 text-center cursor-pointer"
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
                                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mb-2"></div>
                                        <span class="text-[10px] font-bold text-gray-500">กำลังอัปโหลด</span>
                                    </template>
                                    <template v-else>
                                        <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 group-hover:scale-110 transition-transform">
                                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                        </div>
                                        <div class="text-emerald-700 font-bold text-xs">เพิ่มรูปภาพ</div>
                                    </template>
                                </div>
                            </template>
                            
                            <template #item="{ element, index }">
                                <div class="relative group rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all bg-white aspect-square shadow-sm" :class="index === 0 ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200 hover:border-emerald-300'">
                                    <img :src="getImageUrl(element)" class="w-full h-full object-cover">
                                    
                                    <div v-if="index === 0" class="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-sm z-10 pointer-events-none">
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
                </div>
            </div>

            <!-- CKEditor Detail Content -->
            <div>
                <label class="block text-sm font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">เนื้อหาจัดเต็ม / รายละเอียดเจาะลึก (Rich Text)</label>
                <div class="prose max-w-none bg-white lg:prose-lg rounded-xl overflow-hidden border border-gray-200">
                    <ckeditor :editor="editor" v-model="currentProject.content_rich" :config="editorConfig"></ckeditor>
                </div>
            </div>
        </div>

        <!-- ═══ Sticky Bottom Save Bar ═══ -->
        <div class="sticky bottom-0 z-[99] px-6 py-4 bg-white/95 backdrop-blur-lg border-t border-gray-200 rounded-b-3xl flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div class="flex items-center gap-2 text-sm text-gray-400">
                <div class="w-2 h-2 rounded-full shrink-0" :class="currentProject.title ? 'bg-emerald-400' : 'bg-gray-300'"></div>
                <span v-if="currentProject.title" class="font-medium text-gray-600 truncate max-w-[200px] sm:max-w-[400px]">{{ currentProject.title }}</span>
                <span v-else class="text-gray-400">ยังไม่ได้ตั้งชื่อผลงาน</span>
            </div>
            <div class="flex items-center gap-3">
                <button @click="cancelForm" class="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                <button @click="saveProject" :disabled="isSaving" class="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5">
                    <svg v-if="isSaving" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    {{ isSaving ? 'กำลังบันทึก...' : 'บันทึกผลงาน' }}
                </button>
            </div>
        </div>
    </div>

    <!-- DATA LIST VIEW -->
    <div v-else>
        <!-- Filters and Search -->
        <div v-if="!loading && projects.length > 0" class="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <!-- Search -->
            <div class="relative w-full sm:w-80 shrink-0">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input v-model="searchQuery" type="text" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-11 p-3 transition-colors" placeholder="ค้นหาชื่อผลงาน ลูกค้า สถานที่..."/>
            </div>

            <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <!-- Status Filter -->
                <select v-model="filterStatus" class="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3 min-w-[140px]">
                    <option value="all">สถานะทั้งหมด</option>
                    <option value="published">แสดงผล (เผยแพร่)</option>
                    <option value="hidden">ซ่อนอยู่</option>
                </select>

                <!-- Items Per Page -->
                <select v-model="itemsPerPage" class="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-3">
                    <option :value="12">12 รายการ/หน้า</option>
                    <option :value="24">24 รายการ/หน้า</option>
                    <option :value="48">48 รายการ/หน้า</option>
                    <option :value="'all'">ทั้งหมด</option>
                </select>
            </div>
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
            <p class="text-gray-500 font-bold">กำลังโหลดรายการผลงาน...</p>
        </div>
        
        <div v-else-if="projects.length === 0" class="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900">ยังไม่มีผลงาน</h3>
            <p class="text-gray-500 mb-6">คลิกปุ่มด้านบนเพื่อเพิ่มผลงานแรกเข้าสู่ระบบ</p>
            <button @click="createNewProject" class="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500">เพิ่มผลงาน</button>
        </div>

        <div v-else-if="!loading && filteredProjects.length === 0 && projects.length > 0" class="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900">ไม่พบผลลัพธ์การค้นหา</h3>
            <p class="text-gray-500 mb-6">ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะใหม่</p>
            <button @click="searchQuery = ''; filterStatus = 'all'" class="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800">ล้างตัวกรองทั้งหมด</button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div v-for="project in paginatedProjects" :key="project.id" class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                <!-- Cover Image -->
                <div class="aspect-video bg-gray-100 relative group overflow-hidden border-b border-gray-100 flex items-center justify-center">
                    <img v-if="project.cover_image" :src="getImageUrl(project.cover_image)" loading="lazy" class="max-w-full max-h-full object-contain" />
                    <div v-else class="text-gray-400 flex flex-col items-center">
                        <svg class="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span class="text-xs font-medium">ไม่มีรูปภาพ</span>
                    </div>

                    <!-- Actions Overlay -->
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                        <button @click="editProject(project)" class="p-2.5 bg-white text-gray-900 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-bold shadow-lg" title="แก้ไข">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button @click="deleteProject(project.id)" :disabled="deletingId === project.id" class="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-bold shadow-lg disabled:opacity-50 disabled:cursor-wait" title="ลบ">
                            <svg v-if="deletingId === project.id" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>

                    <!-- Badges -->
                    <div class="absolute top-3 left-3 flex items-center gap-2">
                        <span v-if="project.is_published" class="px-2.5 py-1 bg-emerald-500/90 text-white text-[10px] uppercase tracking-wider font-extrabold rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-white/20">เผยแพร่</span>
                        <span v-else class="px-2.5 py-1 bg-gray-500/90 text-white text-[10px] uppercase tracking-wider font-extrabold rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-white/20">ซ่อน</span>
                    </div>
                    <div class="absolute top-3 right-3 flex items-center gap-2">
                        <span class="px-2 py-1 bg-white/90 text-gray-700 text-[10px] font-bold rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-gray-900/5 flex items-center">
                            <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {{ project.gallery_images?.length || 0 }}
                        </span>
                    </div>
                </div>
                
                <!-- Info -->
                <div class="p-5 flex-1 flex flex-col">
                    <h3 class="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{{ project.title }}</h3>
                    <p class="text-sm text-gray-500 line-clamp-2 mb-4">{{ project.description || 'ไม่มีคำอธิบาย' }}</p>
                    
                    <div class="mt-auto space-y-2 pt-4 border-t border-gray-100">
                        <div v-if="project.client_name" class="flex items-center text-xs text-gray-600 font-medium">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            <span class="truncate">{{ project.client_name }}</span>
                        </div>
                        <div v-if="project.location" class="flex items-center text-xs text-gray-600 font-medium">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span class="truncate">{{ project.location }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination Controls -->
        <div v-if="!loading && totalPages > 1 && itemsPerPage !== 'all'" class="flex justify-center items-center gap-2 mb-10">
            <button @click="currentPage--" :disabled="currentPage === 1" class="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <div class="flex items-center gap-1">
                <template v-for="page in totalPages" :key="page">
                    <button v-if="page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1" 
                            @click="currentPage = page" 
                            :class="['w-10 h-10 rounded-lg text-sm font-bold shadow-sm transition-colors', currentPage === page ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50']">
                        {{ page }}
                    </button>
                    <span v-else-if="page === 2 && currentPage > 3 || page === totalPages - 1 && currentPage < totalPages - 2" class="text-gray-400 px-1">...</span>
                </template>
            </div>
            <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
        </div>
    </div>
  </div>
</template>

<style>
/* Make ckeditor area taller */
.ck-editor__editable_inline {
    min-height: 400px;
}
/* Active outline removal for cleaner grid */
.sortable-ghost {
  opacity: 0.4;
}
/* Product Modal Animation */
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>

