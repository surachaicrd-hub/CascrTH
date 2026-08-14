<script setup>
import { ref } from 'vue'

const activeTab = ref('frontend')

const tabs = [
  { id: 'frontend', label: 'ภาคที่ 1: ระบบหน้าบ้าน (Frontend)', icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' },
  { id: 'backend', label: 'ภาคที่ 2: ระบบจัดการหลังบ้าน (CMS)', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'api', label: 'ภาคที่ 3: การเชื่อมต่อ API (Developers)', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { id: 'dev', label: 'ภาคที่ 4: การบำรุงรักษาระบบ (Maintenance)', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

</script>

<template>
  <div class="max-w-6xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-8 p-6 bg-gradient-to-br from-emerald-900 via-emerald-800 to-gray-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
      <!-- Decorative background -->
      <div class="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-500 opacity-10 blur-3xl"></div>
      <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>
      
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wider uppercase mb-4">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            System Blueprint v1.0
          </div>
          <h1 class="text-3xl md:text-4xl font-black tracking-tight mb-2">คู่มือระบบบริหารจัดการฉบับสมบูรณ์</h1>
          <p class="text-emerald-100/70 max-w-2xl text-sm md:text-base leading-relaxed">
            คู่มือการใช้งานเว็บไซต์ ระบบเชื่อมต่อฐานข้อมูล และการจัดการหลังบ้าน (CMS Master Guide) สำหรับแอดมิน ทีมผู้บริหาร และนักพัฒนา
          </p>
        </div>
        <div class="hidden md:flex flex-col gap-2 items-end">
          <div class="text-xs text-gray-400">อัปเดตล่าสุด: {{ new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) }}</div>
          <div class="text-xs text-gray-400">Stack: Vue 3 + Node.js (MySQL 5.6+)</div>
        </div>
      </div>
    </div>

    <!-- Layout -->
    <div class="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
      
      <!-- Outline Navigation -->
      <div class="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-gray-100 flex-shrink-0 sticky top-24 overflow-hidden">
        <div class="p-4 bg-gray-50/50 border-b border-gray-100">
          <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">สารบัญคู่มือ</h3>
        </div>
        <nav class="p-2 space-y-1">
          <button 
            v-for="tab in tabs" :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 text-left',
              activeTab === tab.id 
                ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
            ]"
          >
            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors', activeTab === tab.id ? 'bg-emerald-100/50 text-emerald-600' : 'bg-gray-100 text-gray-400']">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon"></path>
              </svg>
            </div>
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Content Area -->
      <div class="flex-1 min-w-0 bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
        
        <!-- =========================
             TAB 1: FRONTEND
        ========================= -->
        <div v-if="activeTab === 'frontend'" class="prose prose-emerald lg:prose-lg max-w-none">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
               <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </div>
            <div>
              <h2 class="m-0 text-xl font-black tracking-tight">ภาคที่ 1: ระบบหน้าบ้าน (Frontend)</h2>
              <p class="m-0 text-gray-500 text-sm mt-1">โครงสร้างและประสบการณ์ใช้งานมุมมองลูกค้า</p>
            </div>
          </div>

          <p>ระบบหน้าบ้านหรือ Frontend ถูกออกแบบมาเพื่อดึงดูดความสนใจ นำเสนอสินค้า/บริการ และสร้างประสบการณ์ E-Commerce ที่ราบรื่น</p>

          <div class="space-y-8 mt-8">
            <div class="border-l-2 border-gray-200 pl-6">
              <h3 class="text-lg font-bold text-gray-900 mb-2">1.1 หน้าหลัก (Home) และแคตตาล็อก</h3>
              <ul class="text-gray-600">
                <li><strong>Home Banner:</strong> ภาพขนาดใหญ่ด้านบนสุดสำหรับโปรโมทแคมเปญหลัก</li>
                <li><strong>หมวดหมู่แนะนำ (Category Showcase):</strong> แท็บแสดงผลสินค้าขายดี แบ่งตามหมวดหมู่ สามารถกดย้ายหมวดหมู่เพื่อดูสินค้าแนะนำได้ทันทีโดยไม่ต้องเปลี่ยนหน้า</li>
                <li><strong>แคตตาล็อกสินค้า (Products):</strong> หน้ารวมสินค้าทั้งหมด รองรับการกรองหมวดหมู่ และแสดงภาพสินค้ารูปแบบ 1:1 เพื่อป้องกันปัญหาภาพโดนครอบ (Cropped Image)</li>
                <li><strong>รายละเอียดสินค้า:</strong> แสดงแกลลอรี่ภาพสเปค ขนาด น้ำหนัก พร้อมปุ่มหยิบลงตะกร้าอัตโนมัติ</li>
              </ul>
            </div>

            <div class="border-l-2 border-gray-200 pl-6">
              <h3 class="text-lg font-bold text-gray-900 mb-2">1.2 ระบบตะกร้า และสั่งซื้อออนไลน์ (Checkout Flow)</h3>
              <ul class="text-gray-600">
                <li><strong>ระบบคำนวณค่าส่ง:</strong> คำนวณอัตโนมัติตามระยะทางและน้ำหนักสินค้า รองรับฟีเจอร์ "จัดส่งฟรี" และ "พื้นที่งดให้บริการ"</li>
                <li><strong>การจำกัดการซื้อ:</strong> สินค้าบางชนิดถูกเซ็ตเป็นสินค้าขนาดใหญ่ (เช่น บ้านเก็บของ) จะไม่อนุญาตให้ซื้อเกิน 1 ชิ้นต่อ 1 คำสั่งซื้อ</li>
                <li><strong>ช่องทางชำระเงิน:</strong> รองรับการแนบสลิปโอนเงิน ซึ่งจะวิ่งเข้าหลังบ้านในสถานะ "รอตรวจสอบ (Reviewing)"</li>
              </ul>
            </div>



            <div class="border-l-2 border-gray-200 pl-6">
              <h3 class="text-lg font-bold text-gray-900 mb-2">1.4 ระบบคอนเทนต์และผลงานติดตั้ง</h3>
              <ul class="text-gray-600">
                <li><strong>บทความ (Blog):</strong> โครงสร้างรองรับ SEO เต็มรูปแบบ ดึงผู้ใช้งานจาก Google</li>
                <li><strong>ผลงานติดตั้ง (Projects):</strong> หน้ารวมภาพหน้างานจริงของลูกค้า สร้างความน่าเชื่อถือ แสดงโลเคชั่นและวันที่ติดตั้ง พร้อม Gallery Lightbox เด้งขึ้นมากลางจอ</li>
              </ul>
            </div>
          </div>
        </div>


        <!-- =========================
             TAB 2: BACKEND CMS
        ========================= -->
        <div v-if="activeTab === 'backend'" class="prose prose-emerald lg:prose-lg max-w-none">
           <div class="flex items-center gap-4 mb-8">
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
               <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
            </div>
            <div>
              <h2 class="m-0 text-xl font-black tracking-tight">ภาคที่ 2: ระบบจัดการหลังบ้าน (CMS)</h2>
              <p class="m-0 text-gray-500 text-sm mt-1">โครงสร้างเมนูและการบริหารข้อมูลเว็บไซต์ (เข้าสู่ระบบผ่าน <code>/admin</code>)</p>
            </div>
          </div>

          <p>ระบบหลังบ้านถูกออกแบบมาให้บริหารจัดการง่าย (User-Friendly) โครงสร้างเมนูแถบข้าง (Sidebar) แบ่งออกเป็น 4 หมวดหลัก ในแต่ละเมนูจะมีปุ่ม <span class="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs px-2 py-0.5 rounded-full border border-emerald-200"><strong class="inline-flex items-center justify-center w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold font-mono mr-0.5">i</strong>คำอธิบาย</span> ให้คลิกดูรายละเอียดได้ทุกจุด</p>

          <!-- ===================== หมวด 1: ภาพรวม & สถิติ ===================== -->
          <div class="mt-10 mb-6">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm">1</span>
              <h3 class="m-0 text-lg font-black text-gray-900">ภาพรวม & สถิติ</h3>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 mb-8">
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">หน้าหลักแอดมิน (Dashboard)</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">หน้าแรกที่เห็นเมื่อเข้าสู่ระบบ แสดงภาพรวมธุรกิจทั้งหมด</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li><strong>สถิติการ์ด:</strong> จำนวนสินค้า, ใบเสนอราคา, ข้อความลูกค้า, บทความ, ผลงาน, สมาชิก, คำสั่งซื้อ</li>
                <li><strong>AI วิเคราะห์การตลาด:</strong> กดปุ่ม "วิเคราะห์ด้วย AI" เพื่อให้ Gemini AI ประเมิน Traffic และแนะนำกลยุทธ์</li>
                <li><strong>สถิติเข้าชม:</strong> กราฟ 7 วัน/30 วัน, หน้าเว็บยอดนิยม, เวลาที่มีคนเข้าชมมากที่สุด</li>
                <li><strong>ตารางสรุป Leads / ข้อความใหม่:</strong> ดูลูกค้าล่าสุดที่เข้ามาได้ทันที</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">สถิติการเข้าชม (Analytics)</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">วิเคราะห์พฤติกรรมผู้เข้าชมเว็บไซต์แบบละเอียด</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li><strong>ยอดเข้าชมหน้าเว็บ:</strong> จำนวนครั้งทั้งหมดที่หน้าเว็บถูกเปิด (1 คนเข้า 5 หน้า = 5 ยอด)</li>
                <li><strong>ผู้ใช้งาน (Unique Visitors):</strong> จำนวนคนจริงที่ไม่ซ้ำกัน (นับจากเครื่อง/เบราว์เซอร์)</li>
                <li><strong>อัตราการออก (Bounce Rate):</strong> % คนที่เปิดดูหน้าเดียวแล้วปิด — ยิ่งต่ำยิ่งดี</li>
                <li><strong>ความลึกการเลื่อน (Scroll Depth):</strong> ลูกค้าเลื่อนดูเว็บได้เฉลี่ยกี่ %</li>
                <li><strong>เวลาอยู่บนหน้าเว็บ:</strong> เฉลี่ยลูกค้าอยู่นานแค่ไหนก่อนจะไปหน้าอื่น</li>
                <li><strong>หน้าเว็บยอดนิยม:</strong> 10 อันดับหน้าที่คนเข้าชมมากที่สุด</li>
              </ul>
            </div>
          </div>

          <!-- ===================== หมวด 2: ร้านค้า & ลูกค้า ===================== -->
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm">2</span>
              <h3 class="m-0 text-lg font-black text-gray-900">ร้านค้า & ลูกค้า</h3>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 mb-8">
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">จัดการสินค้า</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">เพิ่ม แก้ไข ลบ หรือซ่อนสินค้า พร้อมตั้งค่ารายละเอียดทั้งหมด</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li><strong>เพิ่มสินค้า:</strong> กรอกชื่อ, ราคา, คำอธิบาย, รูปภาพ, สเปก, FAQ แล้วกดบันทึก</li>
                <li><strong>AI ช่วยเขียน:</strong> กดปุ่ม AI เพื่อสร้าง SEO, สเปก, FAQ อัตโนมัติจากชื่อสินค้า</li>
                <li><strong>URL Slug:</strong> ลิงก์เฉพาะสินค้า เช่น <code>/product/โรงเรือน-ปลูกพืช</code> มีผลต่อ SEO</li>
                <li><strong>Flash Sale:</strong> ตั้งเวลานับถอยหลังโปรโมชัน หมดเวลาหายไปอัตโนมัติ</li>
                <li><strong>สินค้าหมดชั่วคราว:</strong> ปิดปุ่มสั่งซื้อแต่ยังแสดงบนเว็บ ไม่เสียอันดับ SEO</li>
                <li><strong>ป้ายกำกับ (Badge):</strong> สร้างป้ายกำกับเช่น "จัดส่งฟรี" "รับประกัน 10 ปี" ติดบนรูปสินค้าได้</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">หมวดหมู่สินค้า</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">จัดกลุ่มสินค้าเป็นหมวดหมู่ พร้อมตั้งค่าแม่แบบสเปก</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li><strong>เพิ่มหมวดหมู่:</strong> ตั้งชื่อ เลือกไอคอน ใส่รูปภาพปก</li>
                <li><strong>แม่แบบสเปก:</strong> กำหนดฟิลด์สเปกประจำหมวด (เช่น "ขนาด", "วัสดุ") เมื่อเพิ่มสินค้าใหม่จะมีช่องกรอกให้อัตโนมัติ</li>
                <li><strong>ลำดับการแสดงผล:</strong> ลากจัดเรียงลำดับหมวดหมู่บนหน้าเว็บ</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">ขอใบเสนอราคา (Leads)</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">ข้อมูลลูกค้าที่กรอกฟอร์มขอใบเสนอราคาบนหน้าเว็บ</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li><strong>สถานะ 3 ระดับ:</strong> ใหม่ → ติดต่อแล้ว → ปิดการขาย</li>
                <li><strong>รายละเอียด:</strong> ดูข้อมูลติดต่อ, บริษัท, เลขภาษี, สินค้าที่สนใจ, งบประมาณ</li>
                <li><strong>Export CSV:</strong> ดึงข้อมูลออกเป็นไฟล์ CSV เพื่อวิเคราะห์ใน Excel</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">คำสั่งซื้อ (Orders)</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">จัดการออเดอร์ตั้งแต่สั่งซื้อจนถึงส่งมอบ</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li><strong>ขั้นตอน:</strong> รอชำระ → รอตรวจสลิป → ยืนยัน → จัดเตรียม → จัดส่ง → ส่งถึง</li>
                <li><strong>ตรวจสลิป:</strong> คลิกเข้าไปดูสลิปโอนเงินที่ลูกค้าแนบมา แล้วกดยืนยัน/ปฏิเสธ</li>
                <li><strong>พิมพ์เอกสาร:</strong> สร้างใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ เป็น PDF</li>
                <li><strong>Export CSV:</strong> ดึงรายงานคำสั่งซื้อแบบกรองตามช่วงเวลาได้</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">จัดการลูกค้าสมาชิก</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">ดูข้อมูลลูกค้าที่สมัครสมาชิกออนไลน์</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li>ดูประวัติการสั่งซื้อของลูกค้าแต่ละราย</li>
                <li>ดูที่อยู่จัดส่ง และสถานะการยืนยันอีเมล</li>
                <li>ค้นหาลูกค้าจากชื่อ เบอร์โทร หรืออีเมล</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">รีวิวสินค้า</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">ตรวจสอบ อนุมัติ หรือลบรีวิวที่ลูกค้าเขียน</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li>รีวิวใหม่จะรอการอนุมัติก่อนแสดงบนหน้าเว็บ</li>
                <li>สามารถตอบกลับรีวิวของลูกค้าได้</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">โค้ดส่วนลด (Coupons)</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">สร้างโปรโมชันส่วนลดให้ลูกค้าใช้ตอนชำระเงิน</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li><strong>ประเภท %:</strong> ลดตาม % เช่น "ลด 10%" สามารถกำหนดเพดานสูงสุดได้</li>
                <li><strong>ประเภทคงที่ ฿:</strong> ลดตามจำนวนเงิน เช่น "ลด 500 บาท"</li>
                <li><strong>เงื่อนไข:</strong> กำหนดยอดขั้นต่ำ, จำนวนใช้สูงสุด, วันหมดอายุ</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">ผู้ดูแลระบบ</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">จัดการบัญชี Admin ที่ใช้เข้าระบบหลังบ้าน</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li>เพิ่ม/ลบ ผู้ดูแลระบบ กำหนดสิทธิ์การเข้าถึง</li>
                <li>เปลี่ยนรหัสผ่าน หรืออัปโหลดรูปโปรไฟล์</li>
              </ul>
            </div>
          </div>

          <!-- ===================== หมวด 3: หน้าเว็บ & คอนเทนต์ ===================== -->
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">3</span>
              <h3 class="m-0 text-lg font-black text-gray-900">หน้าเว็บ & คอนเทนต์</h3>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 mb-8">
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">พื้นที่หน้าแรก (Banner)</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">ตั้งค่าเนื้อหาที่แสดงบนหน้าแรกของเว็บไซต์</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li><strong>Hero Banner:</strong> รูปภาพขนาดใหญ่ด้านบนสุด แนะนำขนาด 1920×700 px</li>
                <li><strong>Collection Showcase:</strong> เลือกสินค้ามาโชว์บนหน้าแรก จัดเรียงลำดับได้</li>
                <li><strong>หมวดหมู่แนะนำ:</strong> เลือกหมวดหมู่ที่ต้องการให้โชว์ไฮไลท์</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">ผลงานติดตั้ง (Gallery)</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">อัปโหลดรูปภาพผลงานจริงเพื่อสร้างความน่าเชื่อถือ</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li>เพิ่มชื่อโครงการ สถานที่ วันที่ติดตั้ง</li>
                <li>อัปโหลดรูปภาพหลายใบต่อหนึ่งโครงการ</li>
                <li>ลูกค้าสามารถดูแกลเลอรีผลงานบนหน้าเว็บ</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">บทความ / บล็อก</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">เขียนบทความเพื่อ SEO และประชาสัมพันธ์</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li><strong>AI สร้างบทความ:</strong> ใส่หัวข้อ → AI เขียนเนื้อหาและสร้างรูปภาพปกให้</li>
                <li><strong>SEO Tags:</strong> ตั้ง Title, Description, Keywords เพื่อให้ Google ค้นหาเจอ</li>
                <li><strong>สถานะ:</strong> Draft (ร่าง) หรือ Published (เผยแพร่)</li>
              </ul>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">เกี่ยวกับเรา / บริการ</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">แก้ไขเนื้อหาหน้า "เกี่ยวกับเรา" และ "บริการของเรา"</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li>แก้ไขข้อความ รูปภาพ ข้อมูลบริษัท</li>
                <li>เนื้อหาจะอัปเดตบนหน้าเว็บทันทีหลังกดบันทึก</li>
              </ul>
            </div>
          </div>

          <!-- ===================== หมวด 4: กล่องข้อความ & ระบบ ===================== -->
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-black text-sm">4</span>
              <h3 class="m-0 text-lg font-black text-gray-900">กล่องข้อความ & ระบบหลังบ้าน</h3>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 mb-8">
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">ข้อความลูกค้า (Inbox)</h4>
              <p class="text-sm text-gray-600 !m-0">ข้อความที่ส่งผ่านฟอร์ม "ติดต่อเรา" บนหน้าเว็บ สามารถอ่าน ตอบกลับ หรือทำเครื่องหมายว่าอ่านแล้ว</p>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">อีเมลติดตามข่าว (Newsletter)</h4>
              <p class="text-sm text-gray-600 !m-0">รายชื่อลูกค้าที่ลงทะเบียนรับข่าวสาร สามารถ Export ไปใช้กับระบบส่งอีเมลภายนอกได้</p>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">ช่องทางโซเชียล & ที่อยู่</h4>
              <p class="text-sm text-gray-600 !m-0">ตั้งค่าเบอร์โทร, Line, Facebook, ที่อยู่ และแผนที่ Google Maps ที่แสดงบน Footer ของเว็บ</p>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">คู่มือการติดตั้ง (ลูกค้า)</h4>
              <p class="text-sm text-gray-600 !m-0">จัดการคู่มือวิธีเตรียมพื้นที่และติดตั้งสำหรับลูกค้า</p>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">นโยบาย / ข้อตกลง</h4>
              <p class="text-sm text-gray-600 !m-0">แก้ไขเนื้อหา นโยบายความเป็นส่วนตัว, เงื่อนไขการใช้บริการ, นโยบายคุกกี้ ฯลฯ ข้อความจะอัปเดตหน้าเว็บทันที</p>
            </div>
            <div class="p-5">
              <h4 class="font-bold text-gray-900 !mt-0 !mb-2">ตั้งค่าระบบ (Settings)</h4>
              <p class="text-sm text-gray-600 !m-0 !mb-2">ศูนย์กลางค่าระบบทั้งหมด — หน้าที่สำคัญที่สุดสำหรับแอดมิน</p>
              <ul class="text-sm text-gray-600 space-y-1.5">
                <li><strong>เปิด/ปิดช้อปปิ้งออนไลน์:</strong> ปิดระบบตะกร้า เหลือแค่ Catalog แสดงสินค้า</li>
                <li><strong>Maintenance Mode:</strong> ปิดหน้าเว็บชั่วคราว แสดงหน้า "กำลังปรับปรุง" แทน</li>
                <li><strong>ค่าจัดส่ง:</strong> ระบบคำนวณจากน้ำหนักรวมอัตโนมัติ กำหนดจัดส่งฟรีได้</li>
                <li><strong>ช่องทางชำระเงิน:</strong> PromptPay, โอนบัญชีธนาคาร, iPay (บัตรเครดิต)</li>
                <li><strong>การแจ้งเตือน:</strong> ตั้งค่า Telegram, LINE OA, Email เพื่อรับแจ้งเตือนออเดอร์ใหม่</li>
                <li><strong>Gemini AI:</strong> ใส่ API Key เพื่อเปิดฟีเจอร์ AI ทั้งหมด (สร้างบทความ, SEO, วิเคราะห์)</li>
                <li><strong>SMTP (อีเมลออก):</strong> ตั้งค่าอีเมลสำหรับส่งใบเสนอราคา/ยืนยันคำสั่งซื้อ</li>
                <li><strong>Social Login:</strong> เปิดให้ลูกค้าล็อกอินด้วย Google / LINE</li>
              </ul>
            </div>
          </div>

          <div class="bg-amber-50 border border-amber-200 p-5 rounded-xl my-8">
            <h4 class="text-amber-800 font-bold !mt-0 !mb-2">คำเตือนเรื่องโครงสร้างตัวหนังสือบนหน้าเว็บ</h4>
            <p class="text-amber-700 text-sm !m-0">การตั้งค่าหน้า "เกี่ยวกับเรา" "นโยบาย" "วิธีการสั่งซื้อ" หากเนื้อหามีความสำคัญเชิงกฎหมาย กรุณาตรวจสอบให้ละเอียด เพราะระบบจะใช้ข้อความเหล่านี้ส่งขึ้นหน้าเว็บ (Frontend) ทันทีหลังกดปุ่มบันทึก หากข้อความผิดพลาด ลูกค้าอาจพบข้อมูลที่ผิดเพี้ยนได้</p>
          </div>

          <div class="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
            <h4 class="text-emerald-800 font-bold !mt-0 !mb-2">เคล็ดลับ: ปุ่มช่วยเหลือ <strong class="inline-flex items-center justify-center w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold font-mono">i</strong></h4>
            <p class="text-emerald-700 text-sm !m-0">ในทุกหน้าของระบบ Admin จะมีปุ่ม <strong class="inline-flex items-center justify-center w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold font-mono">i</strong> เล็กๆ อยู่ข้างหัวข้อหรือฟอร์มสำคัญ คลิกเพื่อดูคำอธิบายละเอียดว่าส่วนนั้นคืออะไรและมีผลอย่างไรต่อหน้าเว็บ โดยไม่ต้องเปิดคู่มือ!</p>
          </div>


        </div>


        <!-- =========================
             TAB 3: DEVELOPER
        ========================= -->
        <div v-if="activeTab === 'dev'" class="prose prose-emerald lg:prose-lg max-w-none">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
               <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <div>
              <h2 class="m-0 text-xl font-black tracking-tight">ภาคที่ 4: การบำรุงรักษาระบบ (Maintenance)</h2>
              <p class="m-0 text-gray-500 text-sm mt-1">Architecture Blueprint และการประเมินเพื่ออัปเดตระบบ</p>
            </div>
          </div>

          <p>เอกสารส่วนนี้มีไว้เพื่อส่งมอบงาน ให้นักพัฒนารายใหม่ หรือฝ่ายดูแลโฮสติ้ง เข้าใจกลไกระบบทั้งหมด</p>

          <h3 class="text-lg font-bold border-b pb-2">4.1 สถาปัตยกรรม ฐานข้อมูล (Database Architecture)</h3>
          <p>เพื่อรับประกันว่า WebApp สามารถติดตั้งได้บน Shared Hosting แทบทุกแบบ ไม่เว้นแม้แต่เครื่องรุ่นเก่าที่ยังรัน MySQL 5.6 โครงสร้าง DB ของระบบจึงไม่ได้พึ่งพา JSON Field โดยตรง:</p>
          <ul>
            <li>ฟิลด์ที่เก็บค่า Configuration เป็น Object ซ้อนกันในหน้าสินค้า เช่น ข้อมูลแกลลอรี่ภาพ หรือคุณสมบัติพิเศษ จะถูกบีบอัดลงฟิลด์ปะเภท <code>LONGTEXT</code> แทน <code>JSON</code></li>
            <li>ฟิลด์ที่เป็นดัชนีชี้วัดข้อมูล Unique Key ทั้งหมด (เช่น <code>slug</code>, <code>username</code>, <code>email</code>) จะถูกกำหนดโครงสร้างจำกัด (Varchar Length) ไว้ที่ <code>191</code> ตัวอักษร เพื่อหลีกเลี่ยงกฎ Key Limit ระดับระบบ 767 Bytes ที่พบเจอใน Default Engine รุ่นเก่า </li>
          </ul>

          <h3 class="text-lg font-bold border-b pb-2 mt-10">4.2 การ Compile และการ Deploy ระบบขึ้นใช้งาน</h3>
          <p>ฝั่งหน้าบ้านใช้เทคโนโลยี <strong>Vite (Vue 3)</strong> ในการเรนเดอร์ เมื่อพัฒนาฟีเจอร์ใหม่ ให้ทำการรัน <code>npm run build</code> แล้วนำไฟล์ทั้งหมดที่ได้ในโฟลเดอร์ <code>dist</code> ไปวางทับในเครื่องเซิร์ฟเวอร์จริง</p>
          <div class="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl mb-8">
             <h4 class="text-rose-800 font-bold m-0 text-base">กด F5 รีเฟรช แล้วหน้าเว็บขึ้น 404 Found</h4>
             <p class="text-rose-700 text-sm mt-1 mb-0">หากพบปัญหานี้ แสดงว่าการชี้ทาง (Routing) ของโฟลเดอร์มีปัญหา ในการอัปเดตโค้ดครั้งต่อๆ ไป <strong>ห้ามลบไฟล์ <code>.htaccess</code> ออกจากเซิร์ฟเวอร์เด็ดขาด</strong> เพราะเว็บเป็นระบบ SPA (Single Page Application) ต้องอาศัย .htaccess ในการโยน Route ทั้งหมดกลับไปที่ <code>index.html</code> เสมอ</p>
          </div>
        </div>

        <!-- =========================
             TAB 4: API & INTEGRATION
        ========================= -->
        <div v-if="activeTab === 'api'" class="prose prose-emerald lg:prose-lg max-w-none animate-fade-in-up">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
               <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <div>
              <h2 class="m-0 text-xl font-black tracking-tight">ภาคที่ 3: การเชื่อมต่อ API (Developers)</h2>
              <p class="m-0 text-gray-500 text-sm mt-1">เครือข่ายส่งออกข้อมูลและเชื่อมต่อกับโปรแกรมภายนอก (Export APIs Hub)</p>
            </div>
          </div>
          <p>เปิดทางให้ระบบสามารถนำซอฟต์แวร์วิเคราะห์ข้อมูล หรือ ERP (เช่น SAP, โฟลว์แอคเคาท์) มาดึงข้อมูลไปทำการตลาดหรือลงบัญชีต่อได้อัตโนมัติ 
          โดยระบบมีการรองรับการเชื่อมต่อผ่าน <strong>API Token (JWT)</strong> เพื่อความปลอดภัยสูงสุด</p>

          <div class="bg-gray-900 rounded-xl overflow-hidden mt-6 mb-8 shadow-inner">
            <div class="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
              <span class="font-bold text-gray-100 flex items-center gap-2">
                <span class="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded font-mono font-bold">POST</span>
                <span class="font-mono text-sm">/api/admin/api-token</span>
              </span>
              <span class="text-xs text-gray-400">วิธีขอ Token เพื่อเชื่อมต่อ API</span>
            </div>
            <div class="p-4 text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre leading-relaxed">
<span class="text-blue-400"># 1. ส่ง Request ขอ Token ด้วย API Key (Server-to-Server)</span>
POST https://your-domain.com/api/admin/api-token
Content-Type: application/json

{
  "api_key": "YOUR_EXPORT_API_KEY"
}

<span class="text-emerald-400"># 2. ระบบจะคืนค่า Token (อายุ 2 ชั่วโมง)</span>
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "expires_in": 7200,
  "token_type": "Bearer"
}

<span class="text-blue-400"># 3. นำ Token ไปใช้ดึงข้อมูลโดยแนบใน Header</span>
GET https://your-domain.com/api/orders/export
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
<span class="text-gray-500">(* หรือใช้วิธีแนบ ?apikey=YOUR_EXPORT_API_KEY ท้าย URL แบบดั้งเดิมแทนได้เช่นกัน)</span>
            </div>
          </div>
          
          <h4 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            เส้นทางดึงข้อมูล (Endpoints)
          </h4>
          <div class="space-y-4">
            <!-- Order Export -->
            <div class="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <div class="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 bg-white border-b border-gray-200 gap-2">
                <span class="font-bold text-gray-800 flex items-center gap-2">
                  <span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-mono font-bold">GET</span>
                  /api/orders/export
                </span>
                <span class="text-xs text-gray-500">ดึงข้อมูลคำสั่งซื้อทั้งหมด</span>
              </div>
              <div class="px-4 py-3 text-sm text-gray-600">
                <p class="m-0 font-medium text-gray-800">Parameters:</p>
                <ul class="m-0 mt-1 pl-5">
                   <li><code>status</code> (เช่น 'pending', 'shipping')</li>
                   <li><code>startDate</code> (รูปแบบ YYYY-MM-DD)</li>
                   <li><code>endDate</code> (รูปแบบ YYYY-MM-DD)</li>
                </ul>
                <div class="mt-3 text-xs text-gray-400"><i>* หรือ <code>/api/orders/export/:id</code> หากต้องการดึงรายละเอียดคำสั่งซื้อแค่ชุดเดียว</i></div>
              </div>
            </div>

            <!-- Leads Export -->
            <div class="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <div class="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 bg-white border-b border-gray-200 gap-2">
                <span class="font-bold text-gray-800 flex items-center gap-2">
                  <span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-mono font-bold">GET</span>
                  /api/quotation/export
                </span>
                <span class="text-xs text-gray-500">ดึงข้อมูลรายการขอใบเสนอราคา (Leads)</span>
              </div>
              <div class="px-4 py-3 text-sm text-gray-600">
                 <p class="m-0 font-medium text-gray-800">Parameters:</p>
                <ul class="m-0 mt-1 pl-5">
                   <li><code>status</code> ('ใหม่', 'ติดต่อแล้ว', 'ปิดการขาย')</li>
                   <li><code>startDate</code>, <code>endDate</code></li>
                </ul>
              </div>
            </div>

            <!-- Newsletter Export -->
            <div class="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <div class="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 bg-white border-b border-gray-200 gap-2">
                <span class="font-bold text-gray-800 flex items-center gap-2">
                  <span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-mono font-bold">GET</span>
                  /api/newsletter/export
                </span>
                <span class="text-xs text-gray-500">ดึงรายชื่ออีเมลที่ลูกค้าสมัครรับข่าวสาร</span>
              </div>
              <div class="px-4 py-3 text-sm text-gray-600">
                 <p class="m-0 font-medium text-gray-800">Parameters:</p>
                <ul class="m-0 mt-1 pl-5">
                   <li><code>isActive</code> ('true', '1', 'false', '0')</li>
                   <li><code>startDate</code>, <code>endDate</code></li>
                </ul>
              </div>
            </div>

             <!-- Analytics Export -->
            <div class="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <div class="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 bg-white border-b border-gray-200 gap-2">
                <span class="font-bold text-gray-800 flex items-center gap-2">
                  <span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-mono font-bold">GET</span>
                  /api/analytics/export
                </span>
                <span class="text-xs text-gray-500">ดึงสถิติเข้าชมเว็บไซต์ของลูกค้า (Raw Traffic)</span>
              </div>
              <div class="px-4 py-3 text-sm text-gray-600">
                 <p class="m-0 font-medium text-gray-800">Parameters:</p>
                <ul class="m-0 mt-1 pl-5">
                   <li><code>pagePath</code> (ระบุเฉพาะพาร์ทที่ต้องการดึง เช่น /products)</li>
                   <li><code>startDate</code>, <code>endDate</code></li>
                </ul>
              </div>
            </div>
          </div>

          <h4 class="font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            ตัวอย่างผลลัพธ์ (Example JSON Payload)
          </h4>
          <div class="bg-gray-900 rounded-xl overflow-hidden shadow-inner">
            <div class="p-4 text-xs sm:text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre leading-relaxed">
{
  "success": true,
  "count": 1,
  "generated_at": "2024-03-12T10:00:00.000Z",
  "data": [   <span class="text-gray-500">// (orders, leads, subscribers หรือ analytics)</span>
    {
      "order_id": "84d2f0eb-...",
      "status": "pending",
      "total_amount": 59000,
      "shipping_cost": 500,
      "customer_details": {
         "name": "บริษัท ตัวอย่าง จำกัด",
         "tax_id": "01234567890"
      },
      "items": [
         { "sku": "MS-01", "name": "ห้องเก็บของ รุ่น A", "quantity": 1, "unit_price": 59000 }
      ]
    }
  ]
}
            </div>
          </div>

        </div>

        <!-- =========================
          TAB 4: MAINTENANCE (dev)
        ========================= -->
        <div v-if="activeTab === 'dev'" class="prose prose-emerald lg:prose-lg max-w-none animate-fade-in-up">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
               <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <h2 class="m-0 text-xl font-black tracking-tight">ภาคที่ 4: การบำรุงรักษาระบบ (Maintenance)</h2>
              <p class="m-0 text-gray-500 text-sm mt-1">คู่มือสำหรับฝ่ายไอทีหรือผู้ดูแล Server โดยตรง</p>
            </div>
          </div>
          <p>ส่วนนี้เป็นข้อมูลเชิงเทคนิคสำหรับการรักษาความปลอดภัยและทำความสะอาดระบบ เพื่อให้โฮสติ้งทำงานได้อย่างรวดเร็วและใช้พื้นที่ทรัพยากรอย่างคุ้มค่าอยู่เสมอ</p>

          <h3 class="font-bold text-gray-900 border-b pb-2 mt-8">4.1 การลบรูปภาพขยะ (Orphaned Images Cleanup)</h3>
          <p>เมื่อผู้ดูแลระบบทำการส่งรูปภาพขึ้นเว็บไซต์แล้วลบเนื้อหานั้นทิ้ง (อัปโหลดผ่าน CKEditor หรือส่วนอื่น) รูปภาพนั้นจะยังค้างอยู่ในฐานข้อมูล ในเครื่องเซิร์ฟเวอร์เรามีสคริปต์อัตโนมัติสำหรับกวาดล้างขยะเหล่านี้ออก</p>
          <div class="bg-gray-900 rounded-xl overflow-hidden my-4 shadow-inner">
            <div class="px-4 py-3 bg-gray-800 border-b border-gray-700">
               <span class="text-xs font-mono text-gray-300">Run clean-orphans script via command line</span>
            </div>
            <div class="p-4 text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre">
>  cd backend
>  npm run clean-orphans</div>
          </div>
          <ul class="text-sm">
            <li>แนะนำให้รันคำสั่งนี้ <strong>ทุกๆ 1 เดือน</strong> เพื่อลดการเปลืองพื้นที่ของ Server</li>
            <li>คำสั่งนี้จะลบรูปในโฟลเดอร์ <code>uploads/</code> ที่ไม่มีการอ้างอิงถึงใน Database ทั้งหมด</li>
          </ul>

          <h3 class="font-bold text-gray-900 border-b pb-2 mt-8">4.2 การย้ายแพลตฟอร์ม (Database Backup)</h3>
          <p>ระบบ Database ใช้ MySQL ในการจัดเก็บ หากมีการย้าย Host แนะนำกระบวนการหลักดังนี้:</p>
          <ol class="text-sm">
            <li><b>ส่งออกข้อมูล:</b> ให้ทำการ Export ไฟล์จาก phpMyAdmin หรือรัน <code>mysqldump</code> เพื่อเก็บไฟล์ .sql ออกมา</li>
            <li><b>สำรองไฟล์รูปภาพ:</b> รูปถูกเก็บแยกส่วนในโฟลเดอร์ <code>backend/uploads/</code> โปรดทำ zip โฟลเดอร์รูปไปด้วยทุกครั้งที่แบคอัปหน้าเว็บ</li>
            <li><b>จัดการ Environment Variables:</b> นำไฟล์ <code>.env</code> ไปด้วยเพราะมีค่าของ JWT_SECRET ไม่เช่นนั้นสมาชิกทั้งหมดและแอดมินจะต้องล็อกอินใหม่</li>
          </ol>

          <h3 class="font-bold text-gray-900 border-b pb-2 mt-8">4.3 การต่ออายุ SSL และ Domain</h3>
          <p>หากเข้าสู่ระบบหรือเปิดหน้าเว็บไม่ได้ มีโอกาสเกิดจากการไม่ต่ออายุ Domain ให้ตรวจสอบว่ามีสัญลักษณ์รูปแม่กุญแจอยู่ตรงแถบ URL ด้านบนหรือไม่ หากไม่มีให้ตรวจสอบผู้ให้บริการ Hosting ว่าระบบ Auto-SSL ขัดข้องหรือไม่</p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
