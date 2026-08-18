<script setup>
import { ref, onMounted } from 'vue'
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
const uploadingImage = ref(false)
const lightboxImage = ref('')

// AI Content Generation
const aiGenerating = ref(false)
const aiPrompt = ref('')
const aiUseContext = ref(false)

const activeTab = ref('hero')

// Hero Section
const about_hero_title = ref('')
const about_hero_subtitle = ref('')
const about_hero_desc = ref('')
const about_hero_bg = ref('')

// Company Story & Background
const about_story_title = ref('')
const about_story_p1 = ref('')
const about_story_p2 = ref('')
const about_story_check_1 = ref('')
const about_story_check_2 = ref('')
const about_story_check_3 = ref('')
const about_story_check_4 = ref('')

// Main Visual
const about_main_img = ref('')
const about_quote_title = ref('')
const about_quote_text = ref('')

// Core Values (with images)
const about_core_1_title = ref('')
const about_core_1_desc = ref('')
const about_core_1_img = ref('')
const about_core_2_title = ref('')
const about_core_2_desc = ref('')
const about_core_2_img = ref('')
const about_core_3_title = ref('')
const about_core_3_desc = ref('')
const about_core_3_img = ref('')
const about_core_4_title = ref('')
const about_core_4_desc = ref('')
const about_core_4_img = ref('')

// Vision, Mission & Stats
const about_vision_title = ref('')
const about_vision_desc = ref('')
const about_vision_img = ref('')
const about_mission_title = ref('')
const about_mission_desc = ref('')
const about_stat_1_val = ref('')
const about_stat_1_label = ref('')
const about_stat_2_val = ref('')
const about_stat_2_label = ref('')
const about_stat_3_val = ref('')
const about_stat_3_label = ref('')
const about_stat_4_val = ref('')
const about_stat_4_label = ref('')

// CTA Banner
const about_cta_title = ref('')
const about_cta_desc = ref('')

// Rich Content
const about_content_rich = ref('')

// Reusable image upload helper
const uploadSectionImage = async (key, event) => {
  const file = event.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('image', file)
  try {
    const res = await apiFetch('/api/upload', { method: 'POST', body: formData, headers: {} })
    const data = await res.json()
    if (data.success && data.url) {
      if (key === 'about_hero_bg') about_hero_bg.value = data.url
      else if (key === 'about_core_1_img') about_core_1_img.value = data.url
      else if (key === 'about_core_2_img') about_core_2_img.value = data.url
      else if (key === 'about_core_3_img') about_core_3_img.value = data.url
      else if (key === 'about_core_4_img') about_core_4_img.value = data.url
      else if (key === 'about_vision_img') about_vision_img.value = data.url
      
      showToast('อัปโหลดรูปภาพสำเร็จ', 'success')
    } else {
      showToast('อัปโหลดไม่สำเร็จ', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาดในการอัปโหลด', 'error')
  }
  event.target.value = ''
}

const loadSettings = async () => {
  try {
    const res = await apiFetch('/api/settings')
    const data = await res.json()
    if (data.success && data.data) {
      if (data.data.about_hero_title) about_hero_title.value = data.data.about_hero_title
      if (data.data.about_hero_subtitle) about_hero_subtitle.value = data.data.about_hero_subtitle
      if (data.data.about_hero_desc) about_hero_desc.value = data.data.about_hero_desc
      if (data.data.about_hero_bg) about_hero_bg.value = data.data.about_hero_bg

      if (data.data.about_story_title) about_story_title.value = data.data.about_story_title
      if (data.data.about_story_p1) about_story_p1.value = data.data.about_story_p1
      if (data.data.about_story_p2) about_story_p2.value = data.data.about_story_p2
      if (data.data.about_story_check_1) about_story_check_1.value = data.data.about_story_check_1
      if (data.data.about_story_check_2) about_story_check_2.value = data.data.about_story_check_2
      if (data.data.about_story_check_3) about_story_check_3.value = data.data.about_story_check_3
      if (data.data.about_story_check_4) about_story_check_4.value = data.data.about_story_check_4
      
      if (data.data.about_main_img) about_main_img.value = data.data.about_main_img
      if (data.data.about_quote_title) about_quote_title.value = data.data.about_quote_title
      if (data.data.about_quote_text) about_quote_text.value = data.data.about_quote_text
      
      if (data.data.about_core_1_title) about_core_1_title.value = data.data.about_core_1_title
      if (data.data.about_core_1_desc) about_core_1_desc.value = data.data.about_core_1_desc
      if (data.data.about_core_1_img) about_core_1_img.value = data.data.about_core_1_img
      if (data.data.about_core_2_title) about_core_2_title.value = data.data.about_core_2_title
      if (data.data.about_core_2_desc) about_core_2_desc.value = data.data.about_core_2_desc
      if (data.data.about_core_2_img) about_core_2_img.value = data.data.about_core_2_img
      if (data.data.about_core_3_title) about_core_3_title.value = data.data.about_core_3_title
      if (data.data.about_core_3_desc) about_core_3_desc.value = data.data.about_core_3_desc
      if (data.data.about_core_3_img) about_core_3_img.value = data.data.about_core_3_img
      if (data.data.about_core_4_title) about_core_4_title.value = data.data.about_core_4_title
      if (data.data.about_core_4_desc) about_core_4_desc.value = data.data.about_core_4_desc
      if (data.data.about_core_4_img) about_core_4_img.value = data.data.about_core_4_img
      
      if (data.data.about_vision_title) about_vision_title.value = data.data.about_vision_title
      if (data.data.about_vision_desc) about_vision_desc.value = data.data.about_vision_desc
      if (data.data.about_vision_img) about_vision_img.value = data.data.about_vision_img
      if (data.data.about_mission_title) about_mission_title.value = data.data.about_mission_title
      if (data.data.about_mission_desc) about_mission_desc.value = data.data.about_mission_desc
      if (data.data.about_stat_1_val) about_stat_1_val.value = data.data.about_stat_1_val
      if (data.data.about_stat_1_label) about_stat_1_label.value = data.data.about_stat_1_label
      if (data.data.about_stat_2_val) about_stat_2_val.value = data.data.about_stat_2_val
      if (data.data.about_stat_2_label) about_stat_2_label.value = data.data.about_stat_2_label
      if (data.data.about_stat_3_val) about_stat_3_val.value = data.data.about_stat_3_val
      if (data.data.about_stat_3_label) about_stat_3_label.value = data.data.about_stat_3_label
      if (data.data.about_stat_4_val) about_stat_4_val.value = data.data.about_stat_4_val
      if (data.data.about_stat_4_label) about_stat_4_label.value = data.data.about_stat_4_label
      
      if (data.data.about_cta_title) about_cta_title.value = data.data.about_cta_title
      if (data.data.about_cta_desc) about_cta_desc.value = data.data.about_cta_desc
      
      if (data.data.about_content_rich !== undefined && data.data.about_content_rich !== null) {
        about_content_rich.value = data.data.about_content_rich
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    loading.value = false
  }
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
      about_hero_title: about_hero_title.value,
      about_hero_subtitle: about_hero_subtitle.value,
      about_hero_desc: about_hero_desc.value,
      about_quote_title: about_quote_title.value,
      about_quote_text: about_quote_text.value,
      about_core_1_title: about_core_1_title.value,
      about_core_1_desc: about_core_1_desc.value,
      about_core_2_title: about_core_2_title.value,
      about_core_2_desc: about_core_2_desc.value,
      about_core_3_title: about_core_3_title.value,
      about_core_3_desc: about_core_3_desc.value,
      about_core_4_title: about_core_4_title.value,
      about_core_4_desc: about_core_4_desc.value,
      about_vision_title: about_vision_title.value,
      about_vision_desc: about_vision_desc.value,
      about_mission_title: about_mission_title.value,
      about_mission_desc: about_mission_desc.value,
      about_cta_title: about_cta_title.value,
      about_cta_desc: about_cta_desc.value,
      about_content_rich: about_content_rich.value
    };
  }

  try {
    const res = await apiFetch('/api/ai/generate-about', {
      method: 'POST',
      body: JSON.stringify({
        prompt: aiPrompt.value,
        contextData: contextData
      })
    });
    const result = await res.json();
    
    if (result.success && result.data) {
      const d = result.data;
      if (d.about_hero_title) about_hero_title.value = d.about_hero_title;
      if (d.about_hero_subtitle) about_hero_subtitle.value = d.about_hero_subtitle;
      if (d.about_hero_desc) about_hero_desc.value = d.about_hero_desc;
      
      if (d.about_quote_title) about_quote_title.value = d.about_quote_title;
      if (d.about_quote_text) about_quote_text.value = d.about_quote_text;
      
      if (d.about_core_1_title) about_core_1_title.value = d.about_core_1_title;
      if (d.about_core_1_desc) about_core_1_desc.value = d.about_core_1_desc;
      if (d.about_core_2_title) about_core_2_title.value = d.about_core_2_title;
      if (d.about_core_2_desc) about_core_2_desc.value = d.about_core_2_desc;
      if (d.about_core_3_title) about_core_3_title.value = d.about_core_3_title;
      if (d.about_core_3_desc) about_core_3_desc.value = d.about_core_3_desc;
      if (d.about_core_4_title) about_core_4_title.value = d.about_core_4_title;
      if (d.about_core_4_desc) about_core_4_desc.value = d.about_core_4_desc;
      
      if (d.about_vision_title) about_vision_title.value = d.about_vision_title;
      if (d.about_vision_desc) about_vision_desc.value = d.about_vision_desc;
      if (d.about_mission_title) about_mission_title.value = d.about_mission_title;
      if (d.about_mission_desc) about_mission_desc.value = d.about_mission_desc;
      
      if (d.about_cta_title) about_cta_title.value = d.about_cta_title;
      if (d.about_cta_desc) about_cta_desc.value = d.about_cta_desc;
      
      if (d.about_content_rich) about_content_rich.value = d.about_content_rich;

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

const saveSettings = async () => {
  saving.value = true
  try {
    const settingsPayload = [
      { key: 'about_hero_title', value: about_hero_title.value },
      { key: 'about_hero_subtitle', value: about_hero_subtitle.value },
      { key: 'about_hero_desc', value: about_hero_desc.value },
      { key: 'about_hero_bg', value: about_hero_bg.value },

      { key: 'about_story_title', value: about_story_title.value },
      { key: 'about_story_p1', value: about_story_p1.value },
      { key: 'about_story_p2', value: about_story_p2.value },
      { key: 'about_story_check_1', value: about_story_check_1.value },
      { key: 'about_story_check_2', value: about_story_check_2.value },
      { key: 'about_story_check_3', value: about_story_check_3.value },
      { key: 'about_story_check_4', value: about_story_check_4.value },
      
      { key: 'about_main_img', value: about_main_img.value },
      { key: 'about_quote_title', value: about_quote_title.value },
      { key: 'about_quote_text', value: about_quote_text.value },
      
      { key: 'about_core_1_title', value: about_core_1_title.value },
      { key: 'about_core_1_desc', value: about_core_1_desc.value },
      { key: 'about_core_1_img', value: about_core_1_img.value },
      { key: 'about_core_2_title', value: about_core_2_title.value },
      { key: 'about_core_2_desc', value: about_core_2_desc.value },
      { key: 'about_core_2_img', value: about_core_2_img.value },
      { key: 'about_core_3_title', value: about_core_3_title.value },
      { key: 'about_core_3_desc', value: about_core_3_desc.value },
      { key: 'about_core_3_img', value: about_core_3_img.value },
      { key: 'about_core_4_title', value: about_core_4_title.value },
      { key: 'about_core_4_desc', value: about_core_4_desc.value },
      { key: 'about_core_4_img', value: about_core_4_img.value },
      
      { key: 'about_vision_title', value: about_vision_title.value },
      { key: 'about_vision_desc', value: about_vision_desc.value },
      { key: 'about_vision_img', value: about_vision_img.value },
      { key: 'about_mission_title', value: about_mission_title.value },
      { key: 'about_mission_desc', value: about_mission_desc.value },
      { key: 'about_stat_1_val', value: about_stat_1_val.value },
      { key: 'about_stat_1_label', value: about_stat_1_label.value },
      { key: 'about_stat_2_val', value: about_stat_2_val.value },
      { key: 'about_stat_2_label', value: about_stat_2_label.value },
      { key: 'about_stat_3_val', value: about_stat_3_val.value },
      { key: 'about_stat_3_label', value: about_stat_3_label.value },
      { key: 'about_stat_4_val', value: about_stat_4_val.value },
      { key: 'about_stat_4_label', value: about_stat_4_label.value },
      
      { key: 'about_cta_title', value: about_cta_title.value },
      { key: 'about_cta_desc', value: about_cta_desc.value },
      
      { key: 'about_content_rich', value: about_content_rich.value },
    ]

    const res = await apiFetch('/api/settings/batch', {
      method: 'POST',
      body: JSON.stringify({ settings: settingsPayload })
    })
    const data = await res.json()
    if (data.success) {
      showToast('บันทึกข้อมูลหน้า เกี่ยวกับเรา สำเร็จ', 'success')
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

const uploadImage = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('image', file)
  
  uploadingImage.value = true
  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      about_main_img.value = data.url
      showToast('อัปโหลดรูปภาพสำเร็จ', 'success')
    } else {
      showToast('อัปโหลดล้มเหลว: ' + data.error, 'error')
    }
  } catch (error) {
    console.error('Upload Error:', error)
    showToast('เกิดข้อผิดพลาดในการอัปโหลด', 'error')
  } finally {
    uploadingImage.value = false
    e.target.value = ''
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="h-full flex flex-col pb-24">
    <div class="mb-8">
      <h1 class="text-2xl font-black text-gray-900 tracking-tight">จัดการหน้าเกี่ยวกับเรา (About Us)</h1>
      <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">แก้ไขเนื้อหาและรูปภาพในหน้าแบบฟอร์มประวัติความเป็นมาของบริษัท
        <InfoTooltip title="หน้า About Us" description="จัดการประวัติและวิสัยทัศน์ขององค์กร<ul><li><strong>AI ผู้ช่วย:</strong> สามารถให้ AI ร่างเนื้อหาทั้งหมดแบบอัตโนมัติ</li><li><strong>รูปภาพ Hero:</strong> รูปภาพปกควรใช้สัดส่วน 21:9 กว้างๆ</li><li><strong>ตัวเลขสถิติ:</strong> แนะนำให้ใส่ตัวเลขที่ดึงดูดความสนใจ หรือผลงานที่ผ่านมา</li></ul>" />
      </p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      กำลังดึงข้อมูล...
    </div>

    <div v-else class="w-full space-y-6">
      <form @submit.prevent="saveSettings">

        <!-- AI Assistant Block -->
        <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden mb-6 relative">
          <div v-if="aiGenerating" class="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <svg class="animate-spin h-8 w-8 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-indigo-900 font-bold">AI กำลังเขียนเนื้อหา About Us ทั้งหมด...</p>
            <p class="text-sm text-indigo-600 mt-1">ใช้เวลาประมาณ 10-20 วินาที</p>
          </div>

          <div class="p-6 border-b border-indigo-100/50">
            <h2 class="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              ผู้ช่วย AI เขียนเนื้อหาหน้า About Us
            </h2>
            <p class="text-sm text-indigo-700 mt-1">ให้ AI ช่วยคิดสโลแกน เขียนค่านิยมองค์กร หรือแต่งประวัติบริษัทใหม่ทั้งหมดได้ในคลิกเดียว</p>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-bold text-indigo-900 mb-2">
                คำสั่งหรือข้อมูลบริษัทเบื้องต้น (Prompt)
              </label>
              <textarea v-model="aiPrompt" rows="3" placeholder="เช่น 'เราคือร้านขายอุปกรณ์การเกษตรที่เปิดมา 10 ปี เน้นคุณภาพและความจริงใจกับลูกค้า ช่วยเขียนหน้า About Us ให้ดูน่าเชื่อถือและเป็นมืออาชีพ'" class="w-full border border-indigo-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"></textarea>
            </div>
            
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <label class="flex items-center gap-3 cursor-pointer group">
                <div class="relative flex items-center">
                  <input type="checkbox" v-model="aiUseContext" class="peer sr-only">
                  <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">อ้างอิงและปรับโครงสร้างเนื้อหาเดิมด้านล่าง</span>
                  <span class="text-xs text-gray-500">หากเปิด AI จะอ่านข้อมูลทั้งหมดในฟอร์มนี้ไปเกลาคำและจัดระเบียบให้สวยงามขึ้น</span>
                </div>
              </label>

              <button type="button" @click="generateWithAI" :disabled="aiGenerating || (!aiPrompt && !aiUseContext)" class="shrink-0 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                สร้างร่างเนื้อหาด้วย AI
              </button>
            </div>
          </div>
        </div>
        
        <!-- Tabs Navigation -->
        <div class="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          <button type="button" @click="activeTab = 'hero'" :class="activeTab === 'hero' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'" class="px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2">
            ส่วนหัว & สถิติ
          </button>
          <button type="button" @click="activeTab = 'main'" :class="activeTab === 'main' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'" class="px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2">
            ประวัติบริษัท & จุดเด่น
          </button>
          <button type="button" @click="activeTab = 'core'" :class="activeTab === 'core' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'" class="px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2">
            ค่านิยมหลัก
          </button>
          <button type="button" @click="activeTab = 'vision'" :class="activeTab === 'vision' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'" class="px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2">
            วิสัยทัศน์ & พันธกิจ
          </button>
          <button type="button" @click="activeTab = 'cta'" :class="activeTab === 'cta' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'" class="px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2">
            CTA Banner
          </button>
          <button type="button" @click="activeTab = 'rich'" :class="activeTab === 'rich' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'" class="px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2">
            เนื้อหาเพิ่มเติม
          </button>
        </div>

        <!-- Hero Section -->
        <div v-show="activeTab === 'hero'" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in-up">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
              ส่วนหัวและสถิติ (Hero & Stats)
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">หัวข้อย่อย (Subtitle)</label>
              <input v-model="about_hero_subtitle" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น ผู้เชี่ยวชาญด้าน Wire Harness">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">หัวข้อหลัก (Title)</label>
              <input v-model="about_hero_title" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: ประวัติความเป็นมาของ CR Distribution - เครื่องตัดปอกสายไฟ KODERA">
              <p class="text-[10px] text-gray-400 mt-1">สามารถใช้แท็ก &lt;br/&gt; เพื่อขึ้นบรรทัดใหม่ได้</p>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">รายละเอียด (Description)</label>
              <textarea v-model="about_hero_desc" rows="3" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: เราคือผู้นำเข้าและตัวแทนจำหน่ายเครื่องตัดปอกสายไฟอัตโนมัติ KODERA ประเทศญี่ปุ่น..."></textarea>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">ภาพพื้นหลังส่วนหัว (Hero Background Image)</label>
              <div class="flex items-center gap-4">
                <div v-if="about_hero_bg" class="w-40 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all" @click="lightboxImage = about_hero_bg">
                  <img :src="about_hero_bg" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-40 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <label class="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    เลือกรูปพื้นหลัง
                    <input type="file" accept="image/*" class="hidden" @change="uploadSectionImage('about_hero_bg', $event)" />
                  </label>
                  <button v-if="about_hero_bg" type="button" @click="about_hero_bg = ''" class="ml-2 text-xs text-red-500 hover:text-red-700 font-medium">ลบรูป</button>
                </div>
              </div>
            </div>

            <hr class="border-gray-200 my-6" />

            <!-- Stats Bar -->
            <div class="space-y-4">
              <h3 class="font-bold text-gray-800 border-b border-gray-100 pb-2">แถบตัวเลขสถิติความสำเร็จ (Stats Bar ใต้ Header)</h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Stat 1 -->
                <div class="p-3 border border-gray-200 rounded-xl bg-emerald-50/30">
                  <div class="mb-2">
                    <label class="block text-xs font-bold text-gray-700 mb-1">ตัวเลขที่ 1</label>
                    <input v-model="about_stat_1_val" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold" placeholder="ค่าเริ่มต้น: 20+">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายที่ 1</label>
                    <input v-model="about_stat_1_label" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" placeholder="ค่าเริ่มต้น: ปีแห่งความเชี่ยวชาญด้าน Wire Harness">
                  </div>
                </div>

                <!-- Stat 2 -->
                <div class="p-3 border border-gray-200 rounded-xl bg-emerald-50/30">
                  <div class="mb-2">
                    <label class="block text-xs font-bold text-gray-700 mb-1">ตัวเลขที่ 2</label>
                    <input v-model="about_stat_2_val" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold" placeholder="ค่าเริ่มต้น: 500+">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายที่ 2</label>
                    <input v-model="about_stat_2_label" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" placeholder="ค่าเริ่มต้น: เครื่องจักรที่ส่งมอบสู่โรงงานอุตสาหกรรม">
                  </div>
                </div>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <!-- Stat 3 -->
                <div class="p-3 border border-gray-200 rounded-xl bg-emerald-50/30">
                  <div class="mb-2">
                    <label class="block text-xs font-bold text-gray-700 mb-1">ตัวเลขที่ 3</label>
                    <input v-model="about_stat_3_val" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold" placeholder="ค่าเริ่มต้น: ±0.1mm">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายที่ 3</label>
                    <input v-model="about_stat_3_label" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" placeholder="ค่าเริ่มต้น: ความแม่นยำสูงมาตรฐานญี่ปุ่น">
                  </div>
                </div>

                <!-- Stat 4 -->
                <div class="p-3 border border-gray-200 rounded-xl bg-emerald-50/30">
                  <div class="mb-2">
                    <label class="block text-xs font-bold text-gray-700 mb-1">ตัวเลขที่ 4</label>
                    <input v-model="about_stat_4_val" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold" placeholder="ค่าเริ่มต้น: 100%">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายที่ 4</label>
                    <input v-model="about_stat_4_label" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" placeholder="ค่าเริ่มต้น: รับประกันศูนย์ไทยและ On-site Service">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Company Story & Highlights Section -->
        <div v-show="activeTab === 'main'" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in-up">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              ประวัติบริษัทและจุดเด่น (Company Story & Highlights)
            </h2>
          </div>
          <div class="p-6 space-y-6">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">หัวข้อประวัติความเป็นมา (Story Heading)</label>
              <input v-model="about_story_title" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: มุ่งมั่นส่งมอบโซลูชั่นที่ดีที่สุด เพื่อความคุ้มค่าและความแม่นยำสูงสุด">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">เนื้อหาประวัติ ย่อหน้าที่ 1 (Story Paragraph 1)</label>
                <textarea v-model="about_story_p1" rows="5" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm leading-relaxed" placeholder="ค่าเริ่มต้น: บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด ดำเนินธุรกิจด้วยความมุ่งมั่นในการเป็นผู้นำด้านการจัดจำหน่ายเครื่องตัดปอกสายไฟ KODERA..."></textarea>
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">เนื้อหาประวัติ ย่อหน้าที่ 2 (Story Paragraph 2)</label>
                <textarea v-model="about_story_p2" rows="5" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm leading-relaxed" placeholder="ค่าเริ่มต้น: ด้วยประสบการณ์และความเชี่ยวชาญในอุตสาหกรรมสายไฟกว่า 20 ปี เรามีทีมวิศวกรและช่างผู้ชำนาญพร้อมให้คำปรึกษา..."></textarea>
              </div>
            </div>

            <!-- Checkpoints 4 items -->
            <div class="space-y-3 pt-2">
              <label class="block text-sm font-bold text-gray-700">จุดเด่น 4 รายการ (Checkpoints)</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">จุดเด่นที่ 1</label>
                  <input v-model="about_story_check_1" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: ตัวแทนจำหน่ายมาตรฐาน KODERA Japan แท้ 100%">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">จุดเด่นที่ 2</label>
                  <input v-model="about_story_check_2" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: มีศูนย์บริการและคลังเครื่องจักร/อะไหล่ในไทย">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">จุดเด่นที่ 3</label>
                  <input v-model="about_story_check_3" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: ทีมวิศวกรผู้เชี่ยวชาญ On-site Service ทั่วประเทศ">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">จุดเด่นที่ 4</label>
                  <input v-model="about_story_check_4" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: รับประกันตัวเครื่อง 1 ปีเต็ม พร้อมบริการตรวจเช็ก">
                </div>
              </div>
            </div>

            <hr class="border-gray-200 my-4" />

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">รูปภาพสำนักงานใหญ่ / คลังสินค้า (Main Facility Image)</label>
              
              <!-- Image Upload Area -->
              <div class="mt-2 w-full">
                <label v-if="!about_main_img"
                  class="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-emerald-400 focus:outline-none hover:bg-emerald-50 relative"
                  :class="{'opacity-50 cursor-not-allowed': uploadingImage}">
                  <span class="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span class="font-medium text-gray-600">
                      คลิกเพื่อเลือกรูปภาพสถานที่/คลังสินค้า
                    </span>
                  </span>
                  <input type="file" class="hidden" accept="image/*" @change="uploadSectionImage('about_main_img', $event)">
                </label>

                <!-- Preview Area -->
                <div v-else class="relative group mt-3 aspect-video sm:aspect-[21/9] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <img :src="about_main_img" class="w-full h-full object-cover" alt="Preview" @error="$event.target.src='https://placehold.co/800x400?text=Invalid+Image'" />
                  
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <label class="px-4 py-2 bg-white text-gray-900 rounded-lg shadow cursor-pointer hover:bg-gray-100 transition font-medium text-sm">
                      เปลี่ยนรูปภาพ
                      <input type="file" class="hidden" accept="image/*" @change="uploadSectionImage('about_main_img', $event)" />
                    </label>
                    <button type="button" @click="about_main_img = ''" class="px-4 py-2 bg-red-500 text-white rounded-lg shadow cursor-pointer hover:bg-red-600 transition font-medium text-sm">
                      ลบรูปภาพ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">หัวข้อคำคม (Quote Title)</label>
                <input v-model="about_quote_title" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น มุ่งมั่นส่งมอบเทคโนโลยีความแม่นยำสูง">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">คำคม (Quote Text)</label>
                <textarea v-model="about_quote_text" rows="2" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น &quot;ความแม่นยำและประสิทธิภาพของลูกค้า คืองานบริการอันดับหนึ่งของเรา&quot;"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Core Values Section -->
        <div v-show="activeTab === 'core'" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in-up">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              ค่านิยมหลัก (Core Values)
            </h2>
          </div>
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              
              <!-- Value 1 -->
              <div class="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                <div class="font-bold text-emerald-600 mb-3">ค่านิยมข้อที่ 1</div>
                <div class="mb-3">
                  <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อ</label>
                  <input v-model="about_core_1_title" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: วัสดุชั้นเลิศและฝีมืออันประณีต">
                </div>
                <div class="mb-3">
                  <label class="block text-xs font-bold text-gray-700 mb-1">รูปภาพประกอบ</label>
                  <div class="flex items-center gap-2">
                    <div v-if="about_core_1_img" class="w-16 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50 cursor-pointer" @click="lightboxImage = about_core_1_img">
                      <img :src="about_core_1_img" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1">
                      <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                        เลือกรูป
                        <input type="file" accept="image/*" class="hidden" @change="uploadSectionImage('about_core_1_img', $event)" />
                      </label>
                      <button v-if="about_core_1_img" type="button" @click="about_core_1_img = ''" class="ml-2 text-xs text-red-500 hover:text-red-700">ลบ</button>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">รายละเอียด</label>
                  <textarea v-model="about_core_1_desc" rows="4" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="คำอธิบายค่านิยม..."></textarea>
                </div>
              </div>

              <!-- Value 2 -->
              <div class="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                <div class="font-bold text-emerald-600 mb-3">ค่านิยมข้อที่ 2</div>
                <div class="mb-3">
                  <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อ</label>
                  <input v-model="about_core_2_title" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: การออกแบบที่ลงตัว">
                </div>
                <div class="mb-3">
                  <label class="block text-xs font-bold text-gray-700 mb-1">รูปภาพประกอบ</label>
                  <div class="flex items-center gap-2">
                    <div v-if="about_core_2_img" class="w-16 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50 cursor-pointer" @click="lightboxImage = about_core_2_img">
                      <img :src="about_core_2_img" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1">
                      <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                        เลือกรูป
                        <input type="file" accept="image/*" class="hidden" @change="uploadSectionImage('about_core_2_img', $event)" />
                      </label>
                      <button v-if="about_core_2_img" type="button" @click="about_core_2_img = ''" class="ml-2 text-xs text-red-500 hover:text-red-700">ลบ</button>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">รายละเอียด</label>
                  <textarea v-model="about_core_2_desc" rows="4" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="คำอธิบายค่านิยม..."></textarea>
                </div>
              </div>

              <!-- Value 3 -->
              <div class="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                <div class="font-bold text-emerald-600 mb-3">ค่านิยมข้อที่ 3</div>
                <div class="mb-3">
                  <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อ</label>
                  <input v-model="about_core_3_title" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: กระบวนการผลิตที่ได้มาตรฐาน">
                </div>
                <div class="mb-3">
                  <label class="block text-xs font-bold text-gray-700 mb-1">รูปภาพประกอบ</label>
                  <div class="flex items-center gap-2">
                    <div v-if="about_core_3_img" class="w-16 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50 cursor-pointer" @click="lightboxImage = about_core_3_img">
                      <img :src="about_core_3_img" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1">
                      <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                        เลือกรูป
                        <input type="file" accept="image/*" class="hidden" @change="uploadSectionImage('about_core_3_img', $event)" />
                      </label>
                      <button v-if="about_core_3_img" type="button" @click="about_core_3_img = ''" class="ml-2 text-xs text-red-500 hover:text-red-700">ลบ</button>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">รายละเอียด</label>
                  <textarea v-model="about_core_3_desc" rows="4" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="คำอธิบายค่านิยม..."></textarea>
                </div>
              </div>

              <!-- Value 4 -->
              <div class="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                <div class="font-bold text-emerald-600 mb-3">ค่านิยมข้อที่ 4</div>
                <div class="mb-3">
                  <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อ</label>
                  <input v-model="about_core_4_title" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: การติดตั้งที่ปลอดภัยและรวดเร็ว">
                </div>
                <div class="mb-3">
                  <label class="block text-xs font-bold text-gray-700 mb-1">รูปภาพประกอบ</label>
                  <div class="flex items-center gap-2">
                    <div v-if="about_core_4_img" class="w-16 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50 cursor-pointer" @click="lightboxImage = about_core_4_img">
                      <img :src="about_core_4_img" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1">
                      <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                        เลือกรูป
                        <input type="file" accept="image/*" class="hidden" @change="uploadSectionImage('about_core_4_img', $event)" />
                      </label>
                      <button v-if="about_core_4_img" type="button" @click="about_core_4_img = ''" class="ml-2 text-xs text-red-500 hover:text-red-700">ลบ</button>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">รายละเอียด</label>
                  <textarea v-model="about_core_4_desc" rows="4" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="คำอธิบายค่านิยม..."></textarea>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Vision and Stats Section -->
        <div v-show="activeTab === 'vision'" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in-up">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              ส่วนวิสัยทัศน์และพันธกิจ (Vision & Mission)
            </h2>
          </div>
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Vision -->
              <div class="space-y-4">
                <h3 class="font-bold text-gray-800 border-b border-gray-100 pb-2">วิสัยทัศน์ (Vision)</h3>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">หัวข้อวิสัยทัศน์</label>
                  <input v-model="about_vision_title" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น เพราะเรามุ่งมั่นให้บริการที่ดีที่สุด">
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">รายละเอียดวิสัยทัศน์</label>
                  <textarea v-model="about_vision_desc" rows="4" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="อธิบายวิสัยทัศน์การเติบโต..."></textarea>
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">ภาพประกอบวิสัยทัศน์</label>
                  <div class="flex items-center gap-4">
                    <div v-if="about_vision_img" class="w-32 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer" @click="lightboxImage = about_vision_img">
                      <img :src="about_vision_img" class="w-full h-full object-cover" />
                    </div>
                    <div v-else class="w-32 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50">
                      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <div>
                      <label class="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                        เลือกรูป
                        <input type="file" accept="image/*" class="hidden" @change="uploadSectionImage('about_vision_img', $event)" />
                      </label>
                      <button v-if="about_vision_img" type="button" @click="about_vision_img = ''" class="ml-2 text-xs text-red-500 hover:text-red-700">ลบรูป</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mission -->
              <div class="space-y-4">
                <h3 class="font-bold text-gray-800 border-b border-gray-100 pb-2">พันธกิจ (Mission)</h3>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">หัวข้อพันธกิจ</label>
                  <input v-model="about_mission_title" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น พันธกิจของเรา">
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">รายละเอียดพันธกิจ</label>
                  <textarea v-model="about_mission_desc" rows="4" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="อธิบายพันธกิจขององค์กร..."></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA Banner Section -->
        <div v-show="activeTab === 'cta'" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in-up">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
              แบนเนอร์ปุ่มติดต่อ (CTA Banner)
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">หัวข้อแบนเนอร์ (CTA Title)</label>
              <input v-model="about_cta_title" type="text" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: พร้อมที่จะเริ่มต้นโครงการของคุณหรือยัง?">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">รายละเอียด (CTA Description)</label>
              <textarea v-model="about_cta_desc" rows="3" class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ค่าเริ่มต้น: ติดต่อเราวันนี้เพื่อรับคำปรึกษาและใบเสนอราคาฟรี ทีมงานผู้เชี่ยวชาญของเราพร้อมที่จะเนรมิตพื้นที่ในฝันของคุณให้เป็นจริง"></textarea>
            </div>
          </div>
        </div>

        <!-- Rich Text Additional Content Section -->
        <div v-show="activeTab === 'rich'" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in-up">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              เนื้อหาเพิ่มเติม (ภาพ, วิดีโอ, จัดหน้าอิสระ)
            </h2>
          </div>
          <div class="p-6">
            <ckeditor v-if="editor" :editor="editor" v-model="about_content_rich" :config="editorConfig"></ckeditor>
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
            <span class="text-base">{{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลหน้าเกี่ยวกับเรา' }}</span>
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
