<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const message = ref('')
const conversation = ref([
  { 
    sender: 'ai', 
    text: 'สวัสดีค่ะ! AI Assistant ยินดีให้บริการค่ะ ต้องการให้เราช่วยแนะนำบ้านเก็บของ ตู้เก็บของ หรือประเมินราคาพื้นที่แบบไหน แจ้งได้เลยนะคะ', 
    products: [], 
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
  }
])
const isTyping = ref(false)
const chatContainer = ref(null)
const showFaqMenu = ref(false)

const faqQuestions = [
    { icon: '<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>', text: 'แนะนำบ้านเก็บของขนาดกลางให้หน่อย' },
    { icon: '<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>', text: 'บ้านเก็บของโลหะทนทานไหม?' },
    { icon: '<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v-1"/></svg>', text: 'ช่วยประเมินราคาให้หน่อยได้ไหม?' },
    { icon: '<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>', text: 'พื้นที่ 3x4 เมตร เหมาะกับรุ่นไหน?' },
    { icon: '<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>', text: 'มีบริการติดตั้งไหม ค่าใช้จ่ายเท่าไหร่?' },
    { icon: '<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>', text: 'ขอข้อมูลติดต่อพนักงานขาย' }
]

const sidebarProducts = ref([])

onMounted(async () => {
    try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (data.data) {
            // Get 3 random products for the sidebar
            sidebarProducts.value = data.data.sort(() => 0.5 - Math.random()).slice(0, 3)
        }
    } catch (e) {
        console.error(e)
    }
})

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const goToProduct = (slug) => {
  router.push(`/products/${slug}`)
}

const formatPrice = (price) => {
  if (!price) return 'สอบถามราคา'
  return '฿' + Number(price).toLocaleString()
}

const getImageUrl = (path) => {
  if (!path) return '/placeholder-image.jpg'
  if (path.startsWith('http')) return path
  return `${window.location.origin}${path}`
}

const getParsedImage = (imagesStr) => {
    try {
        const imgs = JSON.parse(imagesStr)
        return imgs.length > 0 ? imgs[0] : null
    } catch {
        return null
    }
}

const parseMarkdown = (text) => {
  if (!text) return '';
  let html = text;
  
  // Escape HTML first (prevent XSS)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Handle ### headings
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-sm font-bold text-gray-900 dark:text-white mt-3 mb-1">$1</h3>');
  
  // Handle markdown links [text](url) → clickable <a> tags
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="ai-link">$1</a>');
  
  // Handle bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
  
  // Handle italic *text* (single asterisk)
  html = html.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1<em>$2</em>$3');
  
  // Auto-link plain URLs that aren't already inside <a> tags
  html = html.replace(/(href="|">)?(https?:\/\/[^\s<]+)/g, (match, prefix, url) => {
    if (prefix) return match
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="ai-link">${url}</a>`
  });
  
  // Auto-link phone numbers (Thai format)
  html = html.replace(/(\d{2,3}-\d{3,4}-?\d{3,4})/g, '<a href="tel:$1" class="ai-link ai-link-phone"><svg class="w-3.5 h-3.5 inline-block mr-1 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>$1</a>');
  
  // Auto-link email addresses
  html = html.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" class="ai-link ai-link-email"><svg class="w-3.5 h-3.5 inline-block mr-1 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>$1</a>');
  
  // Handle line breaks
  html = html.replace(/\n/g, '<br>');
  
  // Handle bullet points (- item)
  html = html.replace(/(?:<br>)?- (.+?)(?=<br>|$)/g, '<li class="ml-4 list-disc marker:text-emerald-500">$1</li>');
  
  // Handle numbered lists (1. item)
  html = html.replace(/(?:<br>)?\d+\.\s+(.+?)(?=<br>|$)/g, '<li class="ml-4 list-decimal marker:text-emerald-500">$1</li>');
  
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>(?:\s*<li[^>]*>.*?<\/li>)*)/g, '<ul class="my-2 space-y-1">$1</ul>');
  
  // Clean up extra <br> before/after block elements
  html = html.replace(/<br>\s*(<ul|<h3)/g, '$1');
  html = html.replace(/(<\/ul>|<\/h3>)\s*<br>/g, '$1');
  
  return html;
}

const sendMessage = async () => {
  if (!message.value.trim()) return

  const userText = message.value
  const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  conversation.value.push({ sender: 'user', text: userText, products: [], time: currentTime })
  message.value = ''
  isTyping.value = true
  scrollToBottom()

  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: userText,
        sessionId: localStorage.getItem('session_id') || 'unknown'
      })
    })

    const data = await res.json()
    const aiTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    conversation.value.push({ 
      sender: 'ai', 
      text: data.reply,
      products: data.products || [],
      time: aiTime
    })
  } catch (err) {
    console.error(err)
    const aiTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    conversation.value.push({ sender: 'ai', text: 'ขออภัยค่ะ ระบบขัดข้องชั่วคราว รบกวนติดต่อแอดมินผ่านช่องทางปกตินะคะ', products: [], time: aiTime })
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}

const clearChat = () => {
    conversation.value = [
        { 
            sender: 'ai', 
            text: 'สวัสดีค่ะ! AI Assistant ยินดีให้บริการค่ะ ต้องการให้เราช่วยแนะนำบ้านเก็บของ ตู้เก็บของ หรือประเมินราคาพื้นที่แบบไหน แจ้งได้เลยนะคะ', 
            products: [], 
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
        }
    ]
    message.value = ''
    // Try to reset session on server side by changing sessionId in local storage or we can just keep the same session but visual is clear
}

const quickAsk = (productName) => {
    message.value = `ช่วยแนะนำรายละเอียดของ ${productName} ให้หน่อยครับ มีสี/ขนาดอะไรบ้าง?`
    sendMessage()
}

const insertQuickPrompt = (prompt) => {
    message.value = prompt
    sendMessage()
}
</script>

<template>
  <div class="bg-[#f0f4f8] dark:bg-[#0a0f16] min-h-screen pt-24 pb-4 transition-colors">
    <div class="max-w-[1400px] mx-auto px-4 sm:px-6 h-[calc(100vh-120px)] flex gap-6">
        
        <!-- Left Sidebar (Hidden on mobile) -->
        <div class="hidden lg:flex flex-col w-[300px] shrink-0 h-full overflow-y-auto scrollbar-hide pr-2">
            
            <!-- About AI Box -->
            <div class="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
                <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/50 relative overflow-hidden">
                    <h3 class="text-[13px] font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                        เกี่ยวกับ AI Assistant
                    </h3>
                    <p class="text-[11px] text-emerald-700 dark:text-emerald-500 leading-relaxed max-w-[80%] relative z-10">
                        ผู้ช่วยอัจฉริยะของเราพร้อมตอบคำถามเกี่ยวกับสินค้า บริการ โปรโมชัน และการติดตั้งได้ตลอด 24 ชั่วโมง
                    </p>
                    <div class="absolute right-[-10px] bottom-[-10px] w-16 h-16 bg-emerald-200 dark:bg-emerald-800 rounded-full flex items-center justify-center opacity-50 z-0">
                         <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
                    </div>
                </div>
            </div>

            <!-- Recommended Sidebar -->
            <div class="flex-1 min-h-0 flex flex-col">
                <div class="flex items-center justify-between px-2 mb-3 shrink-0">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white">สินค้าแนะนำสำหรับคุณ</h3>
                    <RouterLink to="/products" class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">ดูทั้งหมด</RouterLink>
                </div>
                
                <div class="space-y-3 overflow-y-auto scrollbar-hide pb-4 flex-1">
                    <div v-for="item in sidebarProducts" :key="item.id" @click="goToProduct(item.slug)" class="flex gap-3 bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group">
                        <div class="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0">
                             <img :src="getImageUrl(getParsedImage(item.images) || item.image_url)" class="w-full h-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500">
                        </div>
                        <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                                <h4 class="text-xs font-bold text-gray-900 dark:text-white truncate">{{ item.name }}</h4>
                                <p class="text-[10px] text-gray-500 truncate">{{ item.category || '' }}</p>
                            </div>
                            <div class="flex items-center justify-between mt-1">
                                <span class="text-xs font-black text-emerald-600 dark:text-emerald-400">{{ formatPrice(item.price) }}</span>
                                <button @click.stop="quickAsk(item.name)" class="text-gray-300 hover:text-emerald-500 transition-colors" title="ถาม AI เกี่ยวกับสินค้านี้">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Loading / Skeleton state if no products -->
                    <div v-if="sidebarProducts.length === 0" class="space-y-3">
                        <div v-for="i in 3" :key="i" class="flex gap-3 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse">
                            <div class="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                            <div class="flex-1 py-1 space-y-2">
                                <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                                <div class="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                                <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mt-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- Right Main Chat Area -->
        <div class="flex-1 flex flex-col h-full gap-4 min-w-0 relative">
            
            <!-- Chat Header Area -->
            <div class="shrink-0 flex flex-col gap-4">
                <!-- Top Navbar -->
                <div class="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:px-6 shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center shrink-0 border-2 border-white dark:border-gray-900 shadow-sm relative">
                            <svg class="w-6 h-6 text-[#0a7a5a] dark:text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 2.76 1.12 5.26 2.93 7.07L4 22l2.93-.93A9.973 9.973 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
                            <div class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-base sm:text-lg font-black text-gray-900 dark:text-white">AI Assistant</h1>
                                <span class="bg-[#e6f4ea] dark:bg-emerald-900/30 text-[#0a7a5a] dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">ออนไลน์</span>
                            </div>
                            <p class="text-xs text-gray-500 mt-0.5">พร้อมช่วยเหลือคุณตลอด 24 ชั่วโมง</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="clearChat" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            เริ่มแชทใหม่
                        </button>
                        <RouterLink to="/space-calculator" class="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 transition-colors text-gray-500 hover:text-emerald-600" title="คำนวณพื้นที่">
                             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                        </RouterLink>
                    </div>
                </div>

            </div>

            <!-- Chat Board -->
            <div 
                ref="chatContainer"
                class="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide pb-4"
            >
                <div 
                v-for="(msg, index) in conversation" 
                :key="index"
                :class="['flex w-full', msg.sender === 'user' ? 'justify-end' : 'justify-start gap-3']">
                
                <!-- AI Avatar in chat -->
                <div v-if="msg.sender === 'ai'" class="flex-shrink-0 mt-1">
                    <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                        <svg class="w-6 h-6 text-[#0a7a5a] dark:text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 2.76 1.12 5.26 2.93 7.07L4 22l2.93-.93A9.973 9.973 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
                    </div>
                </div>

                <div class="flex flex-col max-w-[85%] xl:max-w-[75%]" :class="msg.sender === 'user' ? 'items-end' : 'items-start'">
                    
                    <div v-if="msg.sender === 'user'" class="flex flex-col items-end gap-1">
                        <div class="px-5 py-3 text-[14px] leading-relaxed shadow-sm bg-[#e6f4ea] dark:bg-emerald-900/40 text-[#1e4620] dark:text-emerald-100 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm border border-emerald-100/50 dark:border-emerald-800/30 whitespace-pre-line">
                            {{ msg.text }}
                        </div>
                        <div class="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                            {{ msg.time || '10:30 AM' }}
                            <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    </div>

                    <div v-else class="flex flex-col items-start gap-1 w-full">
                        <div class="px-5 py-4 text-[14px] leading-relaxed shadow-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-gray-100 dark:border-gray-800 w-full">
                            <div v-html="parseMarkdown(msg.text)" class="ai-message-content"></div>
                            
                            <!-- Product Cards -->
                            <div v-if="msg.products && msg.products.length > 0" class="mt-4 flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide w-full max-w-full">
                                <div
                                    v-for="(product, pi) in msg.products"
                                    :key="'prod-' + pi"
                                    @click="goToProduct(product.slug)"
                                    class="group flex-shrink-0 snap-center flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-all duration-300 w-[200px] sm:w-[220px] cursor-pointer"
                                >
                                    <!-- Product Image Area -->
                                    <div class="w-full aspect-square bg-gray-50/50 dark:bg-gray-900 relative">
                                        <!-- Badges -->
                                        <div class="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/90 backdrop-blur-sm text-blue-600 text-[9px] font-bold shadow-sm">
                                                <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm-1 5a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>
                                                กันน้ำ/กันฝน
                                            </span>
                                            <span v-if="pi === 0" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50/90 backdrop-blur-sm text-orange-600 text-[9px] font-bold shadow-sm self-start">
                                                <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                                ขายดี
                                            </span>
                                        </div>
                                        <div class="absolute inset-0">
                                            <img 
                                                v-if="product.image" 
                                                :src="product.image" 
                                                :alt="product.name"
                                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            >
                                        </div>
                                    </div>
                                    
                                    <!-- Product Details -->
                                    <div class="p-3 w-full border-t border-gray-50 dark:border-gray-700/50 flex-1 flex flex-col bg-white dark:bg-gray-800 relative z-20">
                                        <p class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{{ product.name }}</p>
                                        <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                            <span v-if="product.sku" class="font-semibold text-gray-600 dark:text-gray-300 mr-1">รหัส: {{ product.sku }}</span>
                                            {{ product.category || '' }}
                                        </p>
                                        
                                        <div class="mt-auto pt-3 mb-3 flex items-center gap-2">
                                            <span class="text-sm font-black text-[#0a7a5a] dark:text-emerald-400">{{ formatPrice(product.price) }}</span>
                                            <span v-if="product.originalPrice && product.originalPrice > product.price" class="text-[10px] text-gray-500 dark:text-gray-400 line-through">{{ formatPrice(product.originalPrice) }}</span>
                                        </div>
                                        
                                        <button class="w-full py-1.5 rounded-full border border-[#0a7a5a] text-[#0a7a5a] dark:border-emerald-500 dark:text-emerald-400 text-[11px] font-bold hover:bg-[#0a7a5a] hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-colors mt-auto">
                                            ดูรายละเอียด
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="text-[10px] text-gray-400 mt-0.5 ml-1">
                            {{ msg.time || '10:30 AM' }}
                        </div>
                    </div>
                </div>

                </div>

                <!-- Typing Indicator -->
                <div v-show="isTyping" class="flex justify-start gap-3 w-full">
                    <div class="flex-shrink-0 mt-1">
                        <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                            <svg class="w-6 h-6 text-[#0a7a5a] dark:text-emerald-400 opacity-70 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 2.76 1.12 5.26 2.93 7.07L4 22l2.93-.93A9.973 9.973 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-900 px-5 py-4 rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl flex items-center gap-1.5 shadow-sm border border-gray-100 dark:border-gray-800 h-[48px]">
                        <span class="w-2 h-2 bg-emerald-300 rounded-full animate-bounce"></span>
                        <span class="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                    </div>
                </div>
            </div>

            <!-- Futuristic Input Area -->
            <div class="shrink-0 flex flex-col items-center">
                <form @submit.prevent="sendMessage" class="relative w-[95%] max-w-[800px] flex items-center bg-white dark:bg-gray-900 rounded-[2rem] p-1.5 shadow-sm border border-gray-200 dark:border-gray-800 focus-within:border-emerald-300 dark:focus-within:border-emerald-700 transition-colors">
                    <!-- FAQ Quick Questions Button -->
                    <div class="relative pl-2 pr-1">
                        <button type="button" @click="showFaqMenu = !showFaqMenu" class="w-9 h-9 rounded-full flex items-center justify-center transition-colors" :class="showFaqMenu ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'text-gray-400 hover:text-emerald-500 hover:bg-gray-50 dark:hover:bg-gray-800'" title="คำถามยอดนิยม">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </button>
                        
                        <!-- FAQ Dropdown -->
                        <Transition
                            enter-active-class="transition duration-200 ease-out"
                            enter-from-class="opacity-0 translate-y-2 scale-95"
                            enter-to-class="opacity-100 translate-y-0 scale-100"
                            leave-active-class="transition duration-150 ease-in"
                            leave-from-class="opacity-100 translate-y-0 scale-100"
                            leave-to-class="opacity-0 translate-y-2 scale-95"
                        >
                            <div v-if="showFaqMenu" class="absolute bottom-full left-0 mb-3 w-[320px] bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50">
                                <p class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 px-1">คำถามยอดนิยม</p>
                                <div class="space-y-1">
                                    <button 
                                        v-for="(faq, fi) in faqQuestions" 
                                        :key="fi" 
                                        type="button"
                                        @click="insertQuickPrompt(faq.text); showFaqMenu = false"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors group"
                                    >
                                        <span class="text-lg shrink-0 flex items-center justify-center w-5 h-5" v-html="faq.icon"></span>
                                        <span class="flex-1">{{ faq.text }}</span>
                                        <svg class="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </Transition>
                    </div>
                    
                    <input 
                        v-model="message" 
                        type="text" 
                        placeholder="พิมพ์ข้อความที่คุณต้องการสอบถาม..."
                        class="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none outline-none px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                        @focus="showFaqMenu = false"
                    >
                    <button 
                        type="submit" 
                        :disabled="!message"
                        class="w-10 h-10 shrink-0 bg-[#0a7a5a] hover:bg-[#08634a] disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors mr-1"
                    >
                        <svg class="w-4 h-4 ml-0.5 translate-y-[1px]" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </form>
                <div class="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-3 pb-2 text-center">
                    AI Assistant อาจให้ข้อมูลที่ไม่สมบูรณ์ โปรดตรวจสอบข้อมูลสำคัญอีกครั้งจากแหล่งทางการของร้านค้า
                </div>
            </div>

        </div>

    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.scrollbar-hide::-webkit-scrollbar-track {
    background: transparent;
}
.scrollbar-hide::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 20px;
}
.dark .scrollbar-hide::-webkit-scrollbar-thumb {
    background-color: #475569;
}
.scrollbar-hide:hover::-webkit-scrollbar-thumb {
    background-color: #94a3b8;
}
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Specific styling for AI Markdown messages to ensure beautiful typography */
:deep(.ai-message-content) {
  line-height: 1.6;
}
:deep(.ai-message-content strong) {
  color: #111827; /* Gray 900 */
}
.dark :deep(.ai-message-content strong) {
  color: #ffffff;
}
:deep(.ai-message-content ul) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding-left: 1.25rem;
}
:deep(.ai-message-content li) {
  margin-bottom: 0.25rem;
}
</style>
