<script setup>
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useToast } from '../../composables/useToast'
import { apiFetch } from '../../utils/apiFetch'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'
import { ClassicEditor, Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo, Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed } from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'

const { showToast } = useToast()

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

const loading = ref(true)
const saving = ref(false)
const lightboxImage = ref('')

// AI Content Generation
const aiGenerating = ref(false)
const aiPrompt = ref('')
const aiUseContext = ref(false)

// Settings State
const services_hero_title = ref('')
const services_hero_subtitle = ref('')
const services_hero_desc = ref('')

const services_cta_title = ref('')
const services_cta_desc = ref('')

const services_content_rich = ref('')
const services_hero_bg = ref('')

const uploadHeroBg = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('image', file)
  try {
    const res = await apiFetch('/api/upload', { method: 'POST', body: formData, headers: {} })
    const data = await res.json()
    if (data.success && data.url) {
      services_hero_bg.value = data.url
      showToast('อัปโหลดภาพพื้นหลังสำเร็จ', 'success')
    } else {
      showToast('อัปโหลดไม่สำเร็จ', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาด', 'error')
  }
}

// Services Items (Array of objects)
const services_items = ref([])
const iconPickerOpen = ref(-1)

const iconOptions = [
  { name: 'ตรวจสอบ', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { name: 'ออกแบบ', d: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { name: 'สายฟ้า', d: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { name: 'นาฬิกา', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'รับประกัน', d: 'M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01' },
  { name: 'ซัพพอร์ต', d: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: 'บ้าน', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'โทรศัพท์', d: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
  { name: 'รถขนส่ง', d: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { name: 'ดาว', d: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'เครื่องมือ', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { name: 'คน', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { name: 'แผนที่', d: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { name: 'กุญแจ', d: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
  { name: 'หัวใจ', d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { name: 'กราฟ', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'กล้อง', d: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
  { name: 'ประทับ', d: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { name: 'โลก', d: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'ถูกต้อง', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
]

const addServiceItem = () => {
  services_items.value.push({
    title: '',
    desc: '',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    image: ''
  })
}

const uploadServiceImage = async (index, event) => {
  const file = event.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('image', file)
  try {
    const res = await apiFetch('/api/upload', { method: 'POST', body: formData, headers: {} })
    const data = await res.json()
    if (data.success && data.url) {
      services_items.value[index].image = data.url
      showToast('อัปโหลดรูปภาพสำเร็จ', 'success')
    } else {
      showToast('อัปโหลดไม่สำเร็จ', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาดในการอัปโหลด', 'error')
  }
}

const removeServiceItem = (index) => {
  services_items.value.splice(index, 1)
}

const generateWithAI = async () => {
  if (!aiPrompt.value && !aiUseContext.value) {
    showToast('กรุณาระบุคำสั่ง หรือเลือกใช้ข้อมูลที่มีอยู่', 'error');
    return;
  }

  aiGenerating.value = true;
  let contextData = null;

  if (aiUseContext.value) {
    contextData = {
      services_hero_title: services_hero_title.value,
      services_hero_subtitle: services_hero_subtitle.value,
      services_hero_desc: services_hero_desc.value,
      services_items: services_items.value,
      services_cta_title: services_cta_title.value,
      services_cta_desc: services_cta_desc.value,
      services_content_rich: services_content_rich.value
    };
  }

  try {
    const res = await apiFetch('/api/ai/generate-services', {
      method: 'POST',
      body: JSON.stringify({
        prompt: aiPrompt.value,
        contextData: contextData
      })
    });
    const result = await res.json();
    
    if (result.success && result.data) {
      const d = result.data;
      if (d.services_hero_title) services_hero_title.value = d.services_hero_title;
      if (d.services_hero_subtitle) services_hero_subtitle.value = d.services_hero_subtitle;
      if (d.services_hero_desc) services_hero_desc.value = d.services_hero_desc;
      
      if (d.services_items && Array.isArray(d.services_items)) {
         services_items.value = d.services_items;
      }
      
      if (d.services_cta_title) services_cta_title.value = d.services_cta_title;
      if (d.services_cta_desc) services_cta_desc.value = d.services_cta_desc;
      
      if (d.services_content_rich) services_content_rich.value = d.services_content_rich;

      showToast('เขียนเนื้อหาด้วย AI สำเร็จ โปรดตรวจสอบก่อนบันทึก', 'success');
    } else {
      showToast('ไม่สามารถสร้างเนื้อหาได้: ' + (result.error || 'Unknown Error'), 'error');
    }
  } catch (error) {
    console.error('AI Generation Error:', error);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI', 'error');
  } finally {
    aiGenerating.value = false;
  }
}

const loadSettings = async () => {
  try {
    const res = await apiFetch('/api/settings')
    const data = await res.json()
    if (data.success && data.data) {
      if (data.data.services_hero_title) services_hero_title.value = data.data.services_hero_title
      if (data.data.services_hero_subtitle) services_hero_subtitle.value = data.data.services_hero_subtitle
      if (data.data.services_hero_desc) services_hero_desc.value = data.data.services_hero_desc
      if (data.data.services_hero_bg) services_hero_bg.value = data.data.services_hero_bg
      
      if (data.data.services_items) {
        try {
          services_items.value = JSON.parse(data.data.services_items)
        } catch(e) {
          console.error("Failed parsing services items", e)
        }
      } else {
         // Default if empty
         services_items.value = [
            { title: "ประเมินพื้นที่ด้วยวิศวกร", desc: "ทีมงานผู้เชี่ยวชาญลงตรวจสอบหน้างานจริง...", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
         ]
      }
      
      if (data.data.services_cta_title) services_cta_title.value = data.data.services_cta_title
      if (data.data.services_cta_desc) services_cta_desc.value = data.data.services_cta_desc
      
      if (data.data.services_content_rich) services_content_rich.value = data.data.services_content_rich
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const settingsPayload = [
      { key: 'services_hero_title', value: services_hero_title.value },
      { key: 'services_hero_subtitle', value: services_hero_subtitle.value },
      { key: 'services_hero_desc', value: services_hero_desc.value },
      { key: 'services_hero_bg', value: services_hero_bg.value },
      
      { key: 'services_items', value: JSON.stringify(services_items.value) },
      
      { key: 'services_cta_title', value: services_cta_title.value },
      { key: 'services_cta_desc', value: services_cta_desc.value },
      
      { key: 'services_content_rich', value: services_content_rich.value },
    ]

    const res = await apiFetch('/api/settings/batch', {
      method: 'POST',
      body: JSON.stringify({ settings: settingsPayload })
    })
    const data = await res.json()
    if (data.success) {
      showToast('บันทึกข้อมูลหน้าบริการ สำเร็จ', 'success')
    } else {
      showToast('บันทึกข้อมูลไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Save error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="h-full flex flex-col pb-24">
    <div class="mb-8">
      <h1 class="text-2xl font-black text-gray-900 tracking-tight">จัดการหน้าบริการของเรา (Services)</h1>
      <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">แก้ไขเนื้อหา รายการบริการ และระบบ AI เขียนเนื้อหาอัตโนมัติ
        <InfoTooltip title="ส่วนบริการ (Services)" description="ตั้งค่าข้อมูลเกี่ยวกับบริการที่คุณจัดเตรียมไว้ให้กับลูกค้า<ul><li><strong>เพิ่มบริการใหม่:</strong> กดปุ่ม 'เพิ่มบริการใหม่' ที่ส่วนรายการบริการ เพื่อเพิ่มจำนวนหัวข้อบริการ</li><li><strong>Icon (SVG):</strong> ใช้โค้ดของ SVG Icon สำหรับแสดงสัญลักษณ์ (เฉพาะส่วน d='...')</li><li><strong>ผู้ช่วย AI:</strong> ให้ AI ช่วยเขียนคำโฆษณาหรือสรุปเนื้อหาได้อย่างรวดเร็ว</li></ul>" />
      </p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      กำลังดึงข้อมูล...
    </div>

    <div v-else class="w-full">
      <form @submit.prevent="saveSettings">

        <div class="space-y-6 mb-8">

            <!-- AI Assistant Block -->
            <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden relative">
              <div v-if="aiGenerating" class="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <svg class="animate-spin h-8 w-8 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-indigo-900 font-bold">AI กำลังเขียนเนื้อหา Services ทั้งหมด...</p>
                <p class="text-sm text-indigo-600 mt-1">ใช้เวลาประมาณ 10-20 วินาที</p>
              </div>

              <div class="p-6 border-b border-indigo-100/50">
                <h2 class="text-lg font-bold text-indigo-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  ผู้ช่วย AI เขียนเนื้อหาหน้า บริการ
                </h2>
                <p class="text-sm text-indigo-700 mt-1">ให้ AI ช่วยคิดแผนบริการหลัก สโลแกน และเนื้อหาจูงใจลูกค้าได้ในคลิกเดียว</p>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-sm font-bold text-indigo-900 mb-2">
                    คำสั่งหรือขอบเขตบริการ (Prompt)
                  </label>
                  <textarea v-model="aiPrompt" rows="3" placeholder="เช่น 'บริษัทเรารับติดตั้งโกดัง โครงสร้างเหล็ก และบริการออกแบบ 3D ฟรี ช่วยวิเคราะห์ 6 หัวข้อบริการให้น่าสนใจพร้อมไอคอน'" class="w-full border border-indigo-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"></textarea>
                </div>
                
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <div class="relative flex items-center">
                      <input type="checkbox" v-model="aiUseContext" class="peer sr-only">
                      <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">อ้างอิงและปรับโครงสร้างเนื้อหาเดิมด้านล่าง</span>
                      <span class="text-xs text-gray-500">หากเปิด AI จะอ่านข้อมูลทั้งหมดในฟอร์มนี้ไปเกลาคำและจัดเรียงใหม่ให้สวยงามขึ้น</span>
                    </div>
                  </label>

                  <button type="button" @click="generateWithAI" :disabled="aiGenerating || (!aiPrompt && !aiUseContext)" class="shrink-0 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    สร้างร่างเนื้อหาด้วย AI
                  </button>
                </div>
              </div>
            </div>

            <!-- Hero Section -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50">
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                  ส่วนหัว (Hero Section)
                </h2>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">หัวข้อย่อย (Subtitle / Kicker)</label>
                  <input v-model="services_hero_subtitle" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น บริการระดับมาตรฐานสากล">
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">หัวข้อหลัก (Title)</label>
                  <input v-model="services_hero_title" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น บริการออกแบบและติดตั้ง <br/> แบบครบวงจร">
                  <p class="text-[10px] text-gray-400 mt-1">สามารถใช้แท็ก &lt;br/&gt; เพื่อขึ้นบรรทัดใหม่ได้</p>
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">รายละเอียด (Description)</label>
                  <textarea v-model="services_hero_desc" rows="3" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="คำอธิบายเกริ่นนำความเป็นมา..."></textarea>
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">ภาพพื้นหลัง (Hero Background)</label>
                  <div class="flex items-center gap-4">
                    <div v-if="services_hero_bg" class="w-40 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all" @click="lightboxImage = services_hero_bg">
                      <img :src="services_hero_bg" class="w-full h-full object-cover" />
                    </div>
                    <div v-else class="w-40 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50">
                      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <div>
                      <label class="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        เลือกรูปพื้นหลัง
                        <input type="file" accept="image/*" class="hidden" @change="uploadHeroBg($event)" />
                      </label>
                      <button v-if="services_hero_bg" type="button" @click="services_hero_bg = ''" class="ml-2 text-xs text-red-500 hover:text-red-700 font-medium">ลบรูป</button>
                      <p class="text-[10px] text-gray-400 mt-1">แนะนำขนาด 1920x800 px ขึ้นไป</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- CTA Banner Section -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50">
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                  แบนเนอร์ติดต่อ (Call To Action)
                </h2>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">หัวข้อแบนเนอร์</label>
                  <input v-model="services_cta_title" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น เริ่มต้นเนรมิตพื้นที่ของคุณวันนี้">
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">คำเชิญชวน</label>
                  <input v-model="services_cta_desc" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น ติดต่อทีมงาน บริษัท ซีอาร์ ดิสทริบิวชั่น...">
                </div>
              </div>
            </div>



            <!-- Services Items Section -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  รายการบริการ (Service Items)
                </h2>
                <button type="button" @click="addServiceItem" class="text-sm px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  เพิ่มบริการใหม่
                </button>
              </div>
              <div class="p-6 bg-gray-50/50">
                <draggable v-model="services_items" item-key="title" handle=".drag-handle" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <template #item="{ element, index }">
                    <div class="flex flex-col p-5 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-emerald-300 transition-colors relative group">
                      <div class="flex justify-between items-start mb-4 gap-2">
                        <div class="drag-handle cursor-move text-gray-400 hover:text-emerald-500 p-1 -ml-2 -mt-2 bg-gray-50 rounded-lg shrink-0">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                        </div>
                        <button type="button" @click="removeServiceItem(index)" class="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-2 -mt-2 bg-red-50 hover:bg-red-100 rounded-lg shrink-0" title="ลบบริการนี้">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                      
                      <div class="space-y-4 flex-1">
                        <div>
                          <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อบริการ</label>
                          <input v-model="element.title" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-bold" placeholder="เช่น ออกแบบโครงสร้าง 3D">
                        </div>
                        <!-- Image Upload -->
                        <div>
                          <label class="block text-xs font-bold text-gray-700 mb-1">รูปภาพประกอบ</label>
                          <div class="flex items-center gap-3">
                            <div v-if="element.image" class="w-20 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all" @click="lightboxImage = element.image" title="คลิกเพื่อดูรูปขนาดใหญ่">
                              <img :src="element.image" class="w-full h-full object-cover" />
                            </div>
                            <div v-else class="w-20 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0 bg-gray-50">
                              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </div>
                            <div class="flex-1">
                              <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                เลือกรูป
                                <input type="file" accept="image/*" class="hidden" @change="uploadServiceImage(index, $event)" />
                              </label>
                              <button v-if="element.image" type="button" @click="element.image = ''" class="ml-2 text-xs text-red-500 hover:text-red-700 font-medium">ลบรูป</button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label class="block text-xs font-bold text-gray-700 mb-1">ไอคอน</label>
                          <div class="flex items-center gap-2">
                            <div class="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="element.icon"></path></svg>
                            </div>
                            <button type="button" @click="iconPickerOpen = iconPickerOpen === index ? -1 : index" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">
                              {{ iconPickerOpen === index ? 'ปิด' : 'เลือกไอคอน' }}
                            </button>
                          </div>
                          <div v-if="iconPickerOpen === index" class="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                            <div class="grid grid-cols-5 sm:grid-cols-7 gap-1.5 mb-2">
                              <button v-for="opt in iconOptions" :key="opt.name" type="button" @click="element.icon = opt.d; iconPickerOpen = -1"
                                :title="opt.name"
                                class="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                                :class="element.icon === opt.d ? 'bg-emerald-500 text-white ring-2 ring-emerald-300' : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600'">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="opt.d"></path></svg>
                              </button>
                            </div>
                            <details class="text-[10px] text-gray-400">
                              <summary class="cursor-pointer hover:text-gray-600">หรือใส่ SVG Path เอง</summary>
                              <input v-model="element.icon" type="text" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 mt-1 text-xs font-mono text-gray-500 focus:ring-1 focus:ring-emerald-500" placeholder="M12...">
                            </details>
                          </div>
                        </div>
                        <div class="flex-1 flex flex-col">
                          <label class="block text-xs font-bold text-gray-700 mb-1">รายละเอียดบริการ</label>
                          <textarea v-model="element.desc" rows="3" class="w-full flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" placeholder="อธิบายบริการ..."></textarea>
                        </div>
                      </div>
                    </div>
                  </template>
                </draggable>

                <div v-if="services_items.length === 0" class="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-white mt-4">
                  ยังไม่มีรายการบริการ คลิก "เพิ่มบริการใหม่" เพื่อเริ่มต้น
                </div>
              </div>
            </div>

            <!-- Rich Text Additional Content Section -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-[500px]">
              <div class="p-6 border-b border-gray-100 bg-gray-50">
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  เนื้อหาเพิ่มเติมเจาะลึก (ภาพ, วิดีโอ, จัดหน้าอิสระ)
                </h2>
              </div>
              <div class="p-6 flex-1 [&>.ck]:h-full [&>.ck-editor]:h-full [&>.ck-editor__main]:h-[calc(100%-40px)]">
                <ckeditor v-if="editor" :editor="editor" v-model="services_content_rich" :config="editorConfig"></ckeditor>
              </div>
            </div>

          </div>

        <!-- Actions -->
        <div class="sticky bottom-6 z-40 bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-gray-200 flex justify-between items-center transition-all">
          <div class="hidden sm:block text-sm font-medium text-gray-500">
            โปรดตรวจสอบความถูกต้องก่อนกดบันทึก
          </div>
          <button type="submit" :disabled="saving" class="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
            <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span class="text-base">{{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลหน้าบริการ' }}</span>
          </button>
        </div>

      </form>
    </div>

    <!-- Lightbox Modal -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div v-if="lightboxImage" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" @click.self="lightboxImage = ''">
          <button @click="lightboxImage = ''" class="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors z-10">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <img :src="lightboxImage" class="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.lightbox-enter-active, .lightbox-leave-active { transition: opacity 0.25s ease; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }
</style>
