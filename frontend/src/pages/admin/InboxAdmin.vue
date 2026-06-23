<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../../utils/apiFetch'
import { useConfirm } from '../../composables/useConfirm'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showConfirm } = useConfirm()

const messages = ref([])
const loading = ref(true)
const selectedMessage = ref(null)
const errorMsg = ref('')

const fetchMessages = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/contact-messages')
    
    // Check for HTTP errors like 401 Unauthorized
    if (res.status === 401 || res.status === 403) {
      // The apiFetch interceptor handles the localStorage clearing and redirect automatically!
      return
    }

    const data = await res.json()
    if (data.success) {
      messages.value = data.messages
      errorMsg.value = ''
    } else {
      errorMsg.value = data.error || 'ไม่สามารถโหลดข้อความได้'
    }
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    errorMsg.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('th-TH', { 
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.substring(0, 1).toUpperCase()
}

const selectMessage = async (msg) => {
  selectedMessage.value = msg
  if (!msg.is_read) {
    // Mark as read
    try {
      await apiFetch(`/api/contact-messages/${msg.id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true })
      })
      msg.is_read = 1
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }
}

const deleteMessage = async (id) => {
  const isConfirmed = await showConfirm({
    title: 'ยืนยันการลบข้อความ',
    message: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อความนี้เด็ดขาด? (ไม่สามารถกู้คืนได้)',
    confirmText: 'ลบทิ้ง',
    type: 'danger'
  })
  if (!isConfirmed) return
  
  try {
    const res = await apiFetch(`/api/contact-messages/${id}`, {
      method: 'DELETE'
    })
    
    if (res.ok) {
      messages.value = messages.value.filter(m => m.id !== id)
      if (selectedMessage.value && selectedMessage.value.id === id) {
        selectedMessage.value = null
      }
    }
  } catch (error) {
    console.error('Failed to delete message:', error)
  }
}

// Support for Mobile View handling (List vs Detail)
const isDetailViewMobile = ref(false)

const openMessageMobile = (msg) => {
  selectMessage(msg)
  isDetailViewMobile.value = true
}

const closeDetailMobile = () => {
  isDetailViewMobile.value = false
}

onMounted(() => {
  fetchMessages()
  
  // Auto-refresh when returning to tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      fetchMessages()
    }
  })
})
</script>

<template>
  <div class="h-full flex flex-col pt-0 sm:pt-4">
    <!-- Header -->
    <div class="mb-4 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <svg class="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          กล่องข้อความ (Inbox)
          <span v-if="messages.filter(m => !m.is_read).length > 0" class="flex items-center justify-center w-7 h-7 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg shadow-red-200">
            {{ messages.filter(m => !m.is_read).length }}
          </span>
        </h1>
        <p class="text-sm text-gray-500 mt-2 font-medium flex items-center gap-1">ข้อความติดต่อสอบถามจากลูกค้าผ่านหน้าเว็บไซต์
          <InfoTooltip title="Inbox คืออะไร?" description="ข้อความที่ลูกค้าส่งผ่านหน้า 'ติดต่อเรา' จะแสดงที่นี่<ul><li><strong>จุดสีเขียว:</strong> ข้อความใหม่ (ยังไม่อ่าน) จะมีแถบสีเขียวด้านซ้าย</li><li><strong>อ่านแล้ว:</strong> คลิกที่ข้อความจะเปลี่ยนสถานะเป็น 'อ่านแล้ว' อัตโนมัติ</li><li><strong>ตอบกลับ:</strong> คลิกเบอร์โทร/อีเมลเพื่อติดต่อลูกค้าได้ทันที</li><li><strong>ลบข้อความ:</strong> ลบแล้วไม่สามารถกู้คืนได้</li></ul>" />
        </p>
      </div>
      
      <button @click="fetchMessages" class="group relative px-5 py-2.5 bg-white border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
        <svg :class="['w-4 h-4 transition-transform duration-500', loading ? 'animate-spin' : 'group-hover:rotate-180']" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        อ่านข้อมูลล่าสุด
      </button>
    </div>

    <!-- Main Content Area: Split View -->
    <!-- Add relative for mobile absolute positioning -->
    <div class="flex-1 flex gap-0 sm:gap-6 min-h-0 bg-gray-50/50 sm:bg-transparent -mx-4 sm:mx-0 px-4 sm:px-0 rounded-none sm:rounded-2xl relative">
      
      <!-- Left: Message List -->
      <div 
        :class="[
          'w-full sm:w-[380px] sm:min-w-[340px] flex flex-col transition-transform duration-300 sm:translate-x-0 h-full',
          isDetailViewMobile ? '-translate-x-full absolute sm:relative opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto' : 'translate-x-0'
        ]"
      >
        <div class="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col h-full overflow-hidden">
          <div class="bg-white px-5 py-4 border-b border-gray-100 flex justify-between items-center z-10">
            <h3 class="font-bold text-gray-900 text-base">รายการทั้งหมด</h3>
             <span class="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{{ messages.length }} รายการ</span>
          </div>
          
          <div class="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 bg-gray-50/30 custom-scrollbar">
            <!-- States -->
            <div v-if="loading" class="p-8 text-center flex flex-col items-center justify-center h-full text-gray-400">
               <svg class="animate-spin h-8 w-8 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังโหลดข้อความ...
            </div>
            
            <div v-else-if="errorMsg" class="p-8 text-center flex flex-col items-center justify-center h-full">
              <div class="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
                 <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <p class="text-red-500 font-bold text-sm leading-relaxed">{{ errorMsg }}</p>
            </div>

            <div v-else-if="messages.length === 0" class="p-8 text-center flex flex-col items-center justify-center h-full">
              <div class="w-16 h-16 bg-emerald-50 text-emerald-300 rounded-full flex items-center justify-center mb-4 border border-emerald-100/50">
                 <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
              </div>
              <h3 class="text-gray-900 font-bold mb-1">กล่องข้อความว่างเปล่า</h3>
              <p class="text-sm text-gray-500">รอรับการติดต่อจากลูกค้าของคุณ</p>
            </div>
            
            <!-- Items -->
            <button 
              v-else
              v-for="msg in messages" 
              :key="msg.id"
              @click="openMessageMobile(msg)"
              :class="[
                'w-full text-left p-4 rounded-xl transition-all duration-300 relative group overflow-hidden focus:outline-none',
                selectedMessage?.id === msg.id 
                  ? 'bg-emerald-600 shadow-lg shadow-emerald-200/50 text-white translate-x-1' 
                  : msg.is_read 
                    ? 'bg-white hover:bg-gray-50 border border-transparent shadow-sm hover:shadow text-gray-600' 
                    : 'bg-white border text-gray-900 shadow-md border-emerald-100 hover:border-emerald-300'
              ]"
            >
              <!-- Unread Indicator Line -->
              <div v-if="!msg.is_read && selectedMessage?.id !== msg.id" class="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>

              <div class="flex gap-3">
                <div 
                  class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold shadow-inner"
                  :class="[
                    selectedMessage?.id === msg.id 
                      ? 'bg-white/20 text-white' 
                      : !msg.is_read ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  ]"
                >
                  {{ getInitials(msg.name) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-baseline mb-1">
                    <span 
                      class="font-extrabold truncate pr-2 text-[15px]"
                      :class="selectedMessage?.id === msg.id ? 'text-white' : ''"
                    >
                      {{ msg.name }}
                    </span>
                    <span 
                      class="text-[10px] whitespace-nowrap"
                      :class="selectedMessage?.id === msg.id ? 'text-emerald-100 font-medium' : (msg.is_read ? 'text-gray-400' : 'text-emerald-600 font-bold')"
                    >
                      {{ formatDate(msg.created_at) }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mb-1.5 opacity-90 text-xs">
                     <span class="truncate">{{ msg.email }}</span>
                  </div>
                  <p 
                    class="line-clamp-2 text-xs leading-5"
                    :class="[
                      selectedMessage?.id === msg.id ? 'text-emerald-50/90' : (msg.is_read ? 'text-gray-500' : 'text-gray-700 font-medium')
                    ]"
                  >
                    {{ msg.message }}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Message Detail -->
      <div 
        :class="[
          'flex-1 flex flex-col h-full bg-white sm:rounded-2xl sm:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] sm:border sm:border-gray-100 overflow-hidden transition-transform duration-300 absolute inset-0 sm:relative',
          isDetailViewMobile ? 'translate-x-0 z-20' : 'translate-x-full sm:translate-x-0 opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto'
        ]"
      >
        <template v-if="selectedMessage">
          <!-- Detail Header -->
          <div class="relative bg-white border-b border-gray-100">
             
             <!-- Mobile Back Button -->
             <div class="sm:hidden px-2 py-2 border-b border-gray-100 bg-gray-50 flex items-center">
                <button @click="closeDetailMobile" class="flex items-center gap-1 text-gray-500 hover:text-gray-900 p-2 font-medium">
                   <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                   กลับไปรายการ
                </button>
             </div>

             <div class="p-6 sm:p-10">
               <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                 <div class="flex gap-5 items-start">
                   <div class="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300 text-emerald-800 flex items-center justify-center text-xl font-bold shadow-sm">
                     {{ getInitials(selectedMessage.name) }}
                   </div>
                   <div>
                     <h2 class="text-2xl sm:text-3xl font-black text-gray-900 mb-2 leading-tight">{{ selectedMessage.name }}</h2>
                     <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                       <a :href="'tel:'+selectedMessage.phone" v-if="selectedMessage.phone" class="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors text-sm font-medium">
                         <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                         {{ selectedMessage.phone }}
                       </a>
                       <a :href="'mailto:'+selectedMessage.email" v-if="selectedMessage.email" class="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors text-sm font-medium">
                         <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                         {{ selectedMessage.email }}
                       </a>
                     </div>
                   </div>
                 </div>
                 
                 <!-- Actions & Meta -->
                 <div class="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 p-4 md:p-0 bg-gray-50 rounded-xl md:bg-transparent md:rounded-none">
                   <div class="flex items-center text-sm font-medium text-gray-500 bg-white md:bg-gray-100 px-3 py-1.5 rounded-lg md:rounded-full border border-gray-200 md:border-transparent">
                     <svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     {{ formatDate(selectedMessage.created_at) }}
                   </div>
                   
                   <button @click="deleteMessage(selectedMessage.id)" class="text-red-600 hover:text-white bg-red-50 hover:bg-red-500 border border-red-100 hover:border-red-500 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                     <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                     ลบทิ้ง
                   </button>
                 </div>
               </div>
            </div>
             
             <!-- Decorative Line -->
             <div class="h-1 w-full bg-gradient-to-r from-emerald-100 via-emerald-400 to-indigo-500"></div>
          </div>
          
          <!-- Detail Body -->
          <div class="flex-1 overflow-y-auto px-6 py-8 sm:px-10 sm:py-12 bg-white flex flex-col custom-scrollbar relative">
             <!-- Background Quote Icon Watermark -->
             <svg class="absolute top-8 left-6 w-24 h-24 text-gray-50 opacity-50 pointer-events-none transform -rotate-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
             
             <div class="relative z-10 max-w-3xl whitespace-pre-wrap text-gray-700 leading-relaxed text-base sm:text-lg font-medium selection:bg-emerald-200 selection:text-emerald-900 mb-8">{{ selectedMessage.message }}</div>
             
             <div class="mt-auto">
                <div v-if="selectedMessage.ip_address" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-mono text-gray-400 border border-gray-100">
                  <svg class="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                  Client IP: {{ selectedMessage.ip_address }}
                </div>
             </div>
          </div>
        </template>
        
        <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
          <div class="relative">
             <div class="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50"></div>
             <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm relative z-10 text-emerald-300 border border-emerald-50">
                <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
             </div>
          </div>
          <h3 class="text-xl font-bold text-gray-700 mt-6 mb-2">ยังไม่ได้เลือกข้อความ</h3>
          <p class="text-[15px] font-medium text-gray-500">คลิกที่รายการด้านซ้ายเพื่ออ่านรายละเอียด</p>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Custom Webkit Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}
</style>
