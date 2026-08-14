<template>
  <div class="min-h-screen relative bg-[#f8f9fa] dark:bg-[#0a0f16] pt-24 md:pt-32 pb-20 transition-colors overflow-hidden">
    
    <!-- Ambient Decor (Animated Background) -->
    <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CgkJPGcgc3Ryb2tlPSIjMTA4YjY1IiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMDUiPgoJCQk8cGF0aCBkPSJNMCAwaDQwdjQwaC00MHoiIGZpbGw9Im5vbmUiLz4KCQk8L2c+Cjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,white_10%,transparent_80%)] dark:[mask-image:linear-gradient(to_bottom,rgba(255,255,255,0.05)_10%,transparent_80%)] z-0"></div>
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <div class="absolute -top-[10%] right-[0%] w-[50vw] max-w-[500px] h-[50vw] max-h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full animate-[spin_30s_linear_infinite] origin-center mix-blend-multiply dark:mix-blend-lighten"></div>
      <div class="absolute top-[20%] left-[5%] w-[40vw] max-w-[400px] h-[40vw] max-h-[400px] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full animate-[pulse_10s_ease-in-out_infinite] mix-blend-multiply dark:mix-blend-lighten"></div>
    </div>

    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
      
      <!-- Premium Text Header -->
      <div class="text-center max-w-4xl mx-auto mb-16 md:mb-24 mt-8 md:mt-12">
        <div class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 backdrop-blur-md mb-8 shadow-sm hover:-translate-y-0.5 transition-transform">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"></span>
          <span class="text-xs font-bold text-gray-600 dark:text-gray-300 tracking-widest uppercase">AI Space Consultant</span>
        </div>
        <h1 class="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-8">
          เช็คความพอดี<br class="md:hidden" />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">คำนวณงบประมาณ</span> ทันที
        </h1>
        <p class="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
          ระบุพื้นที่ว่างของคุณ ให้ระบบ AI ของเราช่วยค้นหาตู้เก็บของหรือโรงเรือนที่แมตช์ที่สุด พร้อมแจกแจงค่าติดตั้งและเตรียมพื้นอย่างละเอียด
        </p>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        <!-- Left Column: The Form -->
        <div class="lg:col-span-4 space-y-6">
          
          <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-700/50 p-6 sm:p-8 flex flex-col relative transition-all duration-300 hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)]">
            
            <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-400 rounded-l-3xl"></div>

            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div class="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              ระบุพื้นที่ของคุณ
            </h2>

            <form @submit.prevent="calculate" class="space-y-6 flex-grow relative z-[70]">
              
              <div class="space-y-3">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  <span class="inline-block w-5 h-5 bg-gray-100 dark:bg-gray-700 text-center rounded-full text-xs leading-5 mr-1 text-gray-500">1</span> หมวดหมู่สินค้าที่ต้องการ
                </label>
                <div class="relative mb-6" tabindex="0" @blur="isCategoryDropdownOpen = false" @keydown.esc="isCategoryDropdownOpen = false">
                  <button type="button" @click="isCategoryDropdownOpen = !isCategoryDropdownOpen"
                    class="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-left flex justify-between items-center text-gray-900 dark:text-white font-medium shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700">
                    <span class="truncate">{{ form.categoryName || 'ค้นหาจากทุกหมวดหมู่' }}</span>
                    <svg class="w-4 h-4 text-gray-400 transition-transform duration-300" :class="{ 'rotate-180': isCategoryDropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  
                  <transition name="dropdown">
                    <div v-show="isCategoryDropdownOpen" class="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/40 border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto py-2 custom-scrollbar">
                      <button type="button" @mousedown.prevent="form.categoryName = ''; isCategoryDropdownOpen = false" 
                        class="w-full text-left px-5 py-3 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex justify-between items-center group"
                        :class="form.categoryName === '' ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-900/10' : 'text-gray-700 dark:text-gray-300'">
                        ค้นหาจากทุกหมวดหมู่
                        <svg v-if="form.categoryName === ''" class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </button>
                      <button type="button" v-for="cat in categories" :key="cat.id" @mousedown.prevent="form.categoryName = cat.name; isCategoryDropdownOpen = false"
                        class="w-full text-left px-5 py-3 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex justify-between items-center group"
                        :class="form.categoryName === cat.name ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-900/10' : 'text-gray-700 dark:text-gray-300'">
                        {{ cat.name }}
                        <svg v-if="form.categoryName === cat.name" class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </button>
                    </div>
                  </transition>
                </div>
              </div>

              <div class="space-y-4">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  <span class="inline-block w-5 h-5 bg-gray-100 dark:bg-gray-700 text-center rounded-full text-xs leading-5 mr-1 text-gray-500">2</span> ขนาดพื้นที่เตรียมติดตั้ง
                </label>

                <!-- Input Mode Toggle -->
                <div class="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl gap-1">
                  <button type="button" @click="form.inputType = 'dimensions'"
                    :class="['flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1', form.inputType === 'dimensions' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-600/40' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']">
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5"/></svg>
                    ระบุ กว้าง × ลึก
                  </button>
                  <button type="button" @click="form.inputType = 'area'"
                    :class="['flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1', form.inputType === 'area' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-600/40' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']">
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16M8 4v16M12 4v16M16 4v16"/></svg>
                    ระบุตารางเมตร
                  </button>
                </div>

                <!-- Dimensions Input -->
                <div v-if="form.inputType === 'dimensions'" class="grid grid-cols-3 gap-3">
                  <div class="relative group">
                    <input v-model.number="form.width" type="number" step="0.1" min="0" required id="w_input"
                      class="peer w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-gray-900 dark:text-white text-center font-semibold"
                      placeholder="กว้าง" />
                    <label for="w_input" class="absolute -top-2.5 left-3 px-1 text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-white dark:bg-gray-800 transition-colors peer-focus:text-emerald-500">กว้าง (ม.)</label>
                  </div>
                  <div class="relative group">
                    <input v-model.number="form.length" type="number" step="0.1" min="0" required id="l_input"
                      class="peer w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-gray-900 dark:text-white text-center font-semibold"
                      placeholder="ลึก" />
                    <label for="l_input" class="absolute -top-2.5 left-3 px-1 text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-white dark:bg-gray-800 transition-colors peer-focus:text-emerald-500">ลึก (ม.)</label>
                  </div>
                  <div class="relative group">
                    <input v-model.number="form.height" type="number" step="0.1" min="0" required id="h_input"
                      class="peer w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-gray-900 dark:text-white text-center font-semibold"
                      placeholder="สูง" />
                    <label for="h_input" class="absolute -top-2.5 left-3 px-1 text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-white dark:bg-gray-800 transition-colors peer-focus:text-emerald-500">เพดานสูง (ม.)</label>
                  </div>
                </div>

                <!-- Area Input -->
                <div v-else class="space-y-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="relative group">
                      <input v-model.number="form.area" type="number" step="0.1" min="0" required id="area_input"
                        class="peer w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-gray-900 dark:text-white text-center font-semibold"
                        placeholder="เช่น 6" />
                      <label for="area_input" class="absolute -top-2.5 left-3 px-1 text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-white dark:bg-gray-800 transition-colors peer-focus:text-emerald-500">พื้นที่ (ตร.ม.)</label>
                    </div>
                    <div class="relative group">
                      <input v-model.number="form.height" type="number" step="0.1" min="0" required id="h_input_area"
                        class="peer w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-gray-900 dark:text-white text-center font-semibold"
                        placeholder="สูง" />
                      <label for="h_input_area" class="absolute -top-2.5 left-3 px-1 text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-white dark:bg-gray-800 transition-colors peer-focus:text-emerald-500">เพดานสูง (ม.)</label>
                    </div>
                  </div>
                  <p class="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    การระบุตารางเมตรเป็นการประมาณการ ควรตรวจสอบขนาดกว้างยาวอีกครั้งก่อนสั่งซื้อ
                  </p>
                </div>
              </div>

              <!-- 3. Floor Type -->
              <div class="space-y-3">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  <span class="inline-block w-5 h-5 bg-gray-100 dark:bg-gray-700 text-center rounded-full text-xs leading-5 mr-1 text-gray-500">3</span> สภาพพื้นผิวปัจจุบัน (หน้างาน)
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <!-- Earth -->
                  <button type="button" @click="form.floorType = 'earth'"
                    :class="['relative p-3.5 rounded-2xl border text-left transition-all overflow-hidden', form.floorType === 'earth' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm text-gray-500']">
                    <div v-if="form.floorType === 'earth'" class="absolute -right-2 -top-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white translate-y-1 -translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span :class="['block text-sm font-bold mb-1', form.floorType === 'earth' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white']">พื้นดินแข็ง</span>
                    <span class="block text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> ต้องใช้แผ่นปูพื้น</span>
                  </button>
                  <!-- Grass -->
                  <button type="button" @click="form.floorType = 'grass'"
                    :class="['relative p-3.5 rounded-2xl border text-left transition-all overflow-hidden', form.floorType === 'grass' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm text-gray-500']">
                    <div v-if="form.floorType === 'grass'" class="absolute -right-2 -top-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white translate-y-1 -translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span :class="['block text-sm font-bold mb-1', form.floorType === 'grass' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white']">สนามหญ้า</span>
                    <span class="block text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> ต้องใช้แผ่นปูพื้น</span>
                  </button>
                  <!-- Concrete -->
                  <button type="button" @click="form.floorType = 'concrete'"
                    :class="['relative p-3.5 rounded-2xl border text-left transition-all overflow-hidden', form.floorType === 'concrete' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm text-gray-500']">
                    <div v-if="form.floorType === 'concrete'" class="absolute -right-2 -top-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white translate-y-1 -translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span :class="['block text-sm font-bold mb-1', form.floorType === 'concrete' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white']">พื้นปูน</span>
                    <span class="block text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ติดตั้งได้เลย</span>
                  </button>
                  <!-- Tile -->
                  <button type="button" @click="form.floorType = 'tile'"
                    :class="['relative p-3.5 rounded-2xl border text-left transition-all overflow-hidden', form.floorType === 'tile' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm text-gray-500']">
                    <div v-if="form.floorType === 'tile'" class="absolute -right-2 -top-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white translate-y-1 -translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span :class="['block text-sm font-bold mb-1', form.floorType === 'tile' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white']">พื้นกระเบื้อง</span>
                    <span class="block text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ติดตั้งได้เลย</span>
                  </button>
                </div>
              </div>

              <!-- 4. Delivery Method -->
              <div class="space-y-3">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  <span class="inline-block w-5 h-5 bg-gray-100 dark:bg-gray-700 text-center rounded-full text-xs leading-5 mr-1 text-gray-500">4</span> การจัดส่ง
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <button type="button" @click="form.deliveryMethod = 'delivery'"
                    :class="['relative p-3.5 rounded-2xl border text-center transition-all overflow-hidden', form.deliveryMethod === 'delivery' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm text-gray-500']">
                    <div v-if="form.deliveryMethod === 'delivery'" class="absolute -right-2 -top-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white translate-y-1 -translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span :class="['block text-sm font-bold', form.deliveryMethod === 'delivery' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white']">ใช้บริการจัดส่ง</span>
                  </button>
                  <button type="button" @click="form.deliveryMethod = 'pickup'"
                    :class="['relative p-3.5 rounded-2xl border text-center transition-all overflow-hidden', form.deliveryMethod === 'pickup' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm text-gray-500']">
                    <div v-if="form.deliveryMethod === 'pickup'" class="absolute -right-2 -top-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white translate-y-1 -translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span :class="['block text-sm font-bold', form.deliveryMethod === 'pickup' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white']">รับสินค้าเอง</span>
                  </button>
                </div>
              </div>

              <!-- 5. Install Method -->
              <div class="space-y-3">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  <span class="inline-block w-5 h-5 bg-gray-100 dark:bg-gray-700 text-center rounded-full text-xs leading-5 mr-1 text-gray-500">5</span> การติดตั้ง
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <button type="button" @click="form.installMethod = 'shop'"
                    :class="['relative p-3.5 rounded-2xl border text-center transition-all overflow-hidden', form.installMethod === 'shop' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm text-gray-500']">
                    <div v-if="form.installMethod === 'shop'" class="absolute -right-2 -top-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white translate-y-1 -translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span :class="['block text-sm font-bold', form.installMethod === 'shop' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white']">บริการช่างติดตั้ง</span>
                  </button>
                  <button type="button" @click="form.installMethod = 'self'"
                    :class="['relative p-3.5 rounded-2xl border text-center transition-all overflow-hidden', form.installMethod === 'self' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm text-gray-500']">
                    <div v-if="form.installMethod === 'self'" class="absolute -right-2 -top-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white translate-y-1 -translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span :class="['block text-sm font-bold', form.installMethod === 'self' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white']">ลูกค้าติดตั้งเอง</span>
                  </button>
                </div>
              </div>

              <!-- 6. Distance -->
              <div class="space-y-3">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-500 transition-colors cursor-pointer" title="ประเมินระยะทางจากคลังสินค้า">
                  <span class="inline-block w-5 h-5 bg-gray-100 dark:bg-gray-700 text-center rounded-full text-xs leading-5 mr-1 text-gray-500">6</span> จังหวัดที่จัดส่ง/ติดตั้ง <span class="font-normal text-xs text-gray-400">(ใช้ประเมินค่าเดินทาง)</span>
                </label>
                <div class="relative" ref="provinceDropdownRef">
                  <div @click="isProvinceDropdownOpen = !isProvinceDropdownOpen"
                    class="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-4 py-3.5 pr-10 text-sm focus-within:border-emerald-500 focus-within:ring-emerald-500/20 transition-all text-gray-900 dark:text-white font-semibold cursor-pointer flex items-center justify-between shadow-sm">
                    <span :class="form.provinceName ? 'text-gray-900 dark:text-white' : 'text-gray-400'">
                      {{ form.provinceName || 'เลือกจังหวัด' }}
                    </span>
                    <svg class="w-5 h-5 text-gray-400 transition-transform" :class="{'rotate-180': isProvinceDropdownOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                  
                  <div v-if="isProvinceDropdownOpen" class="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div class="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <div class="relative">
                        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        <input type="text" v-model="searchProvince" placeholder="ค้นหาจังหวัด..." class="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:text-white placeholder-gray-400 transition-colors" @click.stop>
                      </div>
                    </div>
                    <ul class="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                      <li v-if="filteredProvinces.length === 0" class="px-4 py-3 text-sm text-gray-500 text-center">ไม่พบจังหวัดที่ค้นหา</li>
                      <li v-for="prov in filteredProvinces" :key="prov.name" @click="selectProvince(prov)"
                        class="px-4 py-2.5 text-sm cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between"
                        :class="{'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold': form.provinceName === prov.name, 'text-gray-700 dark:text-gray-300': form.provinceName !== prov.name}">
                        {{ prov.name }}
                        <svg v-if="form.provinceName === prov.name" class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                      </li>
                    </ul>
                  </div>
                </div>
                <p class="text-[11px] text-gray-500 text-right pr-2">ค่าจัดส่งคำนวณจากน้ำหนักและพื้นที่</p>
              </div>

            </form>
            
            <div class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/50 w-full relative z-20">
              <button @click="calculate" :disabled="isLoading"
                class="group w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 transition-all duration-300 flex justify-center items-center gap-2 overflow-hidden relative">
                <span class="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                <span v-if="isLoading" class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full shrink-0"></span>
                <span v-else class="relative">ค้นหาสินค้าที่ลงตัว</span>
                <svg v-if="!isLoading" class="w-5 h-5 group-hover:translate-x-1 transition-transform relative" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
            
          </div>
        </div>

        <!-- Right Column: Results Area -->
        <div class="lg:col-span-8 h-full">
          
          <!-- Empty State -->
          <div v-if="!hasCalculated" class="bg-transparent border-dashed border-2 border-gray-200 dark:border-gray-800 rounded-3xl h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 transition-colors hover:border-emerald-300 dark:hover:border-emerald-700/50 group">
            <div class="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50 dark:border-emerald-900 group-hover:scale-110 transition-transform duration-500 mb-6 relative">
              <div class="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping opacity-50"></div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-wide">รอผลการวิเคราะห์...</h3>
            <p class="text-gray-500 dark:text-gray-400 max-w-md text-sm leading-relaxed">
              เมื่อคุณกรอกข้อมูลด้านซ้ายครบถ้วน ระบบเอไอจะทำหน้าที่เสมือนเซลล์ส่วนตัว คำนวณและดึงรายการสินค้าที่ฟิตพื้นที่ของคุณมาแสดงทันที
            </p>
          </div>

          <!-- Results State -->
          <div v-else class="space-y-6">
            
            <div class="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
              <div>
                <h2 class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                  ค้นพบสิ่งที่ใช่
                </h2>
                <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                  พบ <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ recommendedProducts.length }}</span> รายการที่แมตช์กับพื้นที่ของคุณ
                </p>
              </div>
            </div>

            <!-- Disclaimer Notice -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex gap-3 items-start">
              <div class="w-9 h-9 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center shrink-0 text-blue-500 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p class="text-sm font-bold text-blue-900 dark:text-blue-300">เป็นการประเมินค่าใช้จ่ายเบื้องต้นเท่านั้น</p>
                <p class="text-xs text-blue-700 dark:text-blue-400 mt-0.5 leading-relaxed">ราคาค่าแรงและค่าเดินทางอาจมีการเปลี่ยนแปลงตามหน้างานจริง รบกวนลูกค้าแคปหน้าจอนี้เพื่อสอบถามราคาที่ชัดเจนกับแอดมินอีกครั้งครับ</p>
              </div>
            </div>

            <!-- Contact Information Card -->
            <div v-if="settingsStore.contactPhones.length > 0 || settingsStore.contactEmails.length > 0 || settingsStore.contactLines.length > 0 || settingsStore.contactFacebookUrl" class="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <div class="px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <p class="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ติดต่อสอบถาม / สั่งซื้อ
                </p>
              </div>
              <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">

                <!-- Phone -->
                <div v-if="settingsStore.contactPhones.length > 0" class="flex gap-3">
                  <div class="w-9 h-9 bg-gray-900 dark:bg-gray-600 rounded-xl flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">โทรศัพท์</p>
                    <div class="space-y-0.5">
                      <p v-for="(phone, i) in settingsStore.contactPhones" :key="i" class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                        <span v-if="phone.name || phone.label" class="text-gray-400 dark:text-gray-500">{{ phone.name || phone.label }} — </span>
                        <a :href="'tel:' + (phone.value || phone.number)" class="text-gray-800 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors">{{ phone.value || phone.number }}</a>
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Email -->
                <div v-if="settingsStore.contactEmails.length > 0" class="flex gap-3">
                  <div class="w-9 h-9 bg-gray-900 dark:bg-gray-600 rounded-xl flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">อีเมล</p>
                    <div class="space-y-0.5">
                      <p v-for="(email, i) in settingsStore.contactEmails" :key="i" class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                        <span v-if="email.name || email.label" class="text-gray-400 dark:text-gray-500">{{ email.name || email.label }} — </span>
                        <a :href="'mailto:' + (email.value || email.email)" class="text-gray-800 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors break-all">{{ email.value || email.email }}</a>
                      </p>
                    </div>
                  </div>
                </div>

                <!-- LINE -->
                <div v-if="settingsStore.contactLines.length > 0" class="flex gap-3">
                  <div class="w-9 h-9 bg-gray-900 dark:bg-gray-600 rounded-xl flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-[#00B900]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">LINE Official</p>
                    <div class="space-y-0.5">
                      <p v-for="(line, i) in settingsStore.contactLines" :key="i" class="text-[11px] text-gray-500 dark:text-gray-400">
                        <span v-if="line.name || line.label" class="text-gray-400 dark:text-gray-500">{{ line.name || line.label }} — </span>
                        <span class="text-gray-800 dark:text-gray-200 font-semibold">{{ (line.value || line.id || '').replace(/^@/, '') ? '@' + (line.value || line.id || '').replace(/^@/, '') : '' }}</span>
                      </p>
                    </div>
                    <a :href="settingsStore.contactLines[0].url || ('https://line.me/ti/p/~' + (settingsStore.contactLines[0].value || settingsStore.contactLines[0].id || '').replace(/^@/, ''))" target="_blank"
                      class="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#00B900] hover:bg-[#009900] text-white text-[10px] font-bold rounded-lg shadow-sm transition-all hover:shadow-md active:scale-95">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/></svg>
                      เพิ่มเพื่อน
                    </a>
                  </div>
                </div>

                <!-- Facebook -->
                <div v-if="settingsStore.contactFacebookUrl" class="flex gap-3">
                  <div class="w-9 h-9 bg-gray-900 dark:bg-gray-600 rounded-xl flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">Facebook</p>
                    <a :href="settingsStore.contactFacebookUrl" target="_blank" class="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">เยี่ยมชมเพจ →</a>
                  </div>
                </div>

              </div>
            </div>

            <div v-if="recommendedProducts.length === 0 && alternativeProducts.length === 0" class="bg-gray-100 dark:bg-gray-800 rounded-3xl p-10 text-center">
              <p class="text-gray-500 dark:text-gray-400">ไม่พบสินค้าในหมวดหมู่นี้ หรือขนาดพื้นที่เล็กเกินกว่าสินค้าทุกรุ่นของเรา</p>
            </div>

            <!-- Product List -->
            <TransitionGroup name="list" tag="div" class="space-y-5">
              <template v-for="(item, index) in [...recommendedProducts, ...alternativeProducts]" :key="item.product.id + (item.fit.fits ? '-r' : '-a')">
                
                <!-- Separator for Alternatives -->
                <div v-if="!item.fit.fits && (index === 0 || [...recommendedProducts, ...alternativeProducts][index-1].fit.fits)" class="mt-8 mb-4 border-t border-gray-200 dark:border-gray-800 pt-8 text-center relative z-0">
                   <span class="bg-gray-50 dark:bg-[#0a0f16] px-4 text-sm font-bold text-red-600 dark:text-red-400 absolute left-1/2 -top-3 -translate-x-1/2 whitespace-nowrap">
                     {{ recommendedProducts.length === 0 ? 'ไม่มีสินค้าที่ฟิตพอดีเป๊ะ แต่เรามีทางเลือกที่ใกล้เคียงที่สุด' : 'ทางเลือกที่ใกล้เคียง (หากเพิ่มพื้นที่ได้อีกนิด)' }}
                   </span>
                </div>

                <div class="group bg-white dark:bg-gray-800 rounded-3xl shadow-sm border overflow-hidden hover:shadow-xl transition-all duration-300"
                   :class="item.fit.fits ? 'border-gray-100 dark:border-gray-700/80' : 'border-red-200 dark:border-red-800/50 relative'">
                
                <!-- Badge for Alternative Products -->
                <div v-if="!item.fit.fits" class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-10 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                  ต้องการพื้นที่เพิ่ม
                </div>

                <div class="flex flex-col md:flex-row">
                  <!-- Image Box -->
                  <div class="md:w-[200px] lg:w-[240px] shrink-0 p-4 bg-gray-50/50 dark:bg-black/20 flex flex-col items-center justify-center relative overflow-hidden">
                    <div v-if="item.fit.fits && index === 0" class="absolute top-3 left-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      คุ้มค่าที่สุด
                    </div>
                    <img v-if="item.product.image_url" :src="getImageUrl(item.product.image_url)" 
                         :alt="item.product.name" class="w-full h-48 object-contain MixBlendMultiply transform group-hover:scale-105 transition-transform duration-500" />
                    <img v-else-if="getParsedImage(item.product.images)" :src="getImageUrl(getParsedImage(item.product.images))" 
                         :alt="item.product.name" class="w-full h-48 object-contain MixBlendMultiply transform group-hover:scale-105 transition-transform duration-500" />     
                    <div v-else class="text-gray-300 text-sm">ไม่มีรูปภาพ</div>
                  </div>
                  
                  <!-- Meta Box -->
                  <div class="flex-grow min-w-0 p-6 flex flex-col justify-between">
                    <div>
                      <div class="flex justify-between items-start gap-4 mb-2">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 md:pr-4 group-hover:text-emerald-600 transition-colors">
                          {{ item.product.name }}
                        </h3>
                        <!-- Fit Level Badge -->
                        <span v-if="item.fit.level === 'perfect'" class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-1 rounded-full font-bold whitespace-nowrap shrink-0 border border-emerald-200 dark:border-emerald-800 hidden sm:inline-flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> พอดีเป๊ะ
                        </span>
                        <span v-else-if="item.fit.level === 'tight'" class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] px-2 py-1 rounded-full font-bold whitespace-nowrap shrink-0 border border-blue-200 dark:border-blue-800 hidden sm:inline-flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> พอดี (ตึงนิดๆ)
                        </span>
                        <span v-else-if="item.fit.level === 'close'" class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] px-2 py-1 rounded-full font-bold whitespace-nowrap shrink-0 border border-yellow-200 dark:border-yellow-800 hidden sm:inline-flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> พอดีมากๆ
                        </span>
                      </div>
                      
                      <!-- Product Size & Fit Reason -->
                      <div class="flex flex-col gap-1 mb-4">
                        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          ขนาดสินค้า: กว้าง {{ item.dims.w.toFixed(2) }} x ลึก {{ item.dims.l.toFixed(2) }} x สูง {{ item.dims.h.toFixed(2) }} ม.
                        </p>
                        <p class="text-[11px] font-semibold" :class="item.fit.fits ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                          {{ item.fit.reason }}
                        </p>
                      </div>

                      <!-- Receipt/Costs Box -->
                      <div class="bg-gray-50/80 dark:bg-gray-900/40 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
                        <div class="space-y-2.5 text-xs sm:text-sm">
                          
                          <div class="flex justify-between items-end border-b border-gray-200 dark:border-gray-700/50 pb-2 mb-2">
                            <span class="text-gray-500 font-semibold tracking-wide">รายการประเมิน</span>
                            <span class="text-gray-400 text-[10px]">ราคาโดยประมาณ</span>
                          </div>

                          <div class="flex justify-between items-center group/line">
                            <span class="text-gray-700 dark:text-gray-300 font-medium">ค่าสินค้า (ตู้/โรงเรือน)</span>
                            <span class="font-bold text-gray-900 dark:text-white group-hover/line:text-emerald-500 transition-colors">฿{{ formatPrice(item.product.price) }}</span>
                          </div>
                          
                          <div v-if="item.cost.installCost > 0 || item.cost.isSelfInstall || item.cost.isFreeInstallBkk" class="flex justify-between items-center group/line">
                            <span class="text-gray-700 dark:text-gray-300 font-medium">ค่าบริการช่างติดตั้ง 
                              <span v-if="item.cost.isSelfInstall" class="text-[10px] text-teal-600 ml-1">(ลูกค้าติดตั้งเอง)</span>
                              <span v-else-if="item.cost.isFreeInstallBkk" class="text-[10px] text-teal-600 ml-1">(ฟรี กทม.และปริมณฑล)</span>
                              <span v-else-if="item.cost.isFixedCost" class="text-[10px] text-blue-500 ml-1">(ราคาเหมา)</span>
                            </span>
                            <span class="font-bold text-gray-900 dark:text-white group-hover/line:text-emerald-500 transition-colors">
                              <span v-if="item.cost.isSelfInstall || item.cost.isFreeInstallBkk">฿0</span>
                              <span v-else>฿{{ formatPrice(item.cost.installCost) }}</span>
                            </span>
                          </div>
                          
                          <div v-if="item.foundation.needsPrep && item.foundation.cost > 0" class="flex justify-between items-start group/line pt-1">
                            <div class="flex flex-col">
                              <span class="text-gray-700 dark:text-gray-300 font-medium">ค่าแผ่นพื้นลานปู (กันยุบตัว)</span>
                              <span class="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 font-medium">* {{ item.foundation.details }}</span>
                            </div>
                            <span class="font-bold text-gray-900 dark:text-white group-hover/line:text-emerald-500 transition-colors">฿{{ formatPrice(item.foundation.cost) }}</span>
                          </div>
                          
                          <div v-if="item.cost.travelCost > 0 || item.cost.isRestricted || item.cost.isSelfPickup" class="flex justify-between items-center group/line pt-1">
                            <span class="text-gray-700 dark:text-gray-300 font-medium">ค่าจัดส่ง 
                              <span v-if="item.cost.isSelfPickup" class="text-[10px] text-teal-600 ml-1">(รับสินค้าเอง)</span>
                              <span v-else-if="item.cost.isRestricted" class="text-[10px] text-red-500 ml-1">(อยู่นอกพื้นที่จัดส่ง)</span>
                              <span v-else-if="form.distance" class="text-[10px] text-gray-400 ml-1">(~{{ form.distance }} กม.)</span>
                            </span>
                            <span v-if="item.cost.isSelfPickup" class="font-bold text-gray-900 dark:text-white group-hover/line:text-emerald-500 transition-colors">฿0</span>
                            <span v-else-if="!item.cost.isRestricted" class="font-bold text-gray-900 dark:text-white group-hover/line:text-emerald-500 transition-colors">฿{{ formatPrice(item.cost.travelCost) }}</span>
                            <span v-else class="font-bold text-red-500 text-sm">-</span>
                          </div>

                        </div>
                        
                        <!-- Total -->
                        <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-end gap-2">
                          <span class="text-sm font-bold text-gray-900 dark:text-white">รวมค่าใช้จ่ายทั้งสิ้น:</span>
                          <span class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                            ฿{{ formatPrice(item.product.price + item.cost.installCost + item.foundation.cost + item.cost.travelCost) }}
                          </span>
                        </div>

                        <!-- Recommended Accessory -->
                        <div v-if="item.recommendedFloorPanel" class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center gap-3">
                          <img :src="getImageUrl(getParsedImage(item.recommendedFloorPanel.images) || item.recommendedFloorPanel.image_url)" class="w-12 h-12 rounded-lg object-cover bg-white">
                          <div class="flex-1 min-w-0">
                            <p class="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                              <svg class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                              อุปกรณ์เสริมแนะนำ (ตรงรุ่น)
                            </p>
                            <p class="text-[11px] text-gray-600 dark:text-gray-400 truncate mt-0.5">{{ item.recommendedFloorPanel.name }}</p>
                          </div>
                          <div class="text-right shrink-0 flex flex-col items-end">
                            <p class="text-xs font-bold text-gray-900 dark:text-white">+ ฿{{ formatPrice(item.recommendedFloorPanel.price) }}</p>
                            <router-link :to="`/products/${item.recommendedFloorPanel.slug || item.recommendedFloorPanel.id}`" class="text-[10px] text-amber-600 hover:text-amber-700 dark:hover:text-amber-300 hover:underline mt-0.5">ดูรายละเอียด</router-link>
                          </div>
                        </div>

                      </div>
                    </div>
                    
                    <div class="flex justify-end mt-4">
                       <router-link :to="`/products/${item.product.slug || item.product.id}`" 
                                   class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-emerald-600 dark:bg-white dark:text-gray-900 dark:hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                          ดูรายละเอียดและสั่งซื้อ
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                       </router-link>
                    </div>
                  </div>
                </div>
              </div>
              </template>
            </TransitionGroup>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useCalculator } from '../composables/useCalculator'
import { useToast } from '../composables/useToast'
import { useSettingsStore } from '../stores/settingsStore'
import { useSEO } from '../composables/useSEO'
import { apiFetch } from '../utils/apiFetch'

const { parseProductDimensions, checkFit, calculateFoundation, estimateInstallation } = useCalculator()
const { showToast } = useToast()
const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()

onMounted(() => {
  setMeta({
    title: 'คำนวณพื้นที่จัดเก็บ (Space Calculator)',
    description: settingsStore.storeDescription || 'โปรแกรมคำนวณพื้นที่ติดตั้งและค้นหาขนาดสินค้าที่พอดีกับพื้นที่ของคุณแบบอัตโนมัติ',
    canonicalUrl: window.location.href,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "คำนวณพื้นที่จัดเก็บ", "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')
})

const form = reactive({
  categoryName: '',
  inputType: 'dimensions',
  width: null,
  length: null,
  area: null,
  height: null,
  floorType: 'earth',
  distance: null,
  provinceName: '',
  deliveryMethod: 'delivery',
  installMethod: 'shop'
})

const provincesList = [
  { name: 'กรุงเทพมหานคร', distance: 0 },
  { name: 'กระบี่', distance: 810 },
  { name: 'กาญจนบุรี', distance: 130 },
  { name: 'กาฬสินธุ์', distance: 520 },
  { name: 'กำแพงเพชร', distance: 360 },
  { name: 'ขอนแก่น', distance: 450 },
  { name: 'จันทบุรี', distance: 250 },
  { name: 'ฉะเชิงเทรา', distance: 80 },
  { name: 'ชลบุรี', distance: 80 },
  { name: 'ชัยนาท', distance: 195 },
  { name: 'ชัยภูมิ', distance: 340 },
  { name: 'ชุมพร', distance: 460 },
  { name: 'เชียงราย', distance: 780 },
  { name: 'เชียงใหม่', distance: 700 },
  { name: 'ตรัง', distance: 820 },
  { name: 'ตราด', distance: 315 },
  { name: 'ตาก', distance: 420 },
  { name: 'นครนายก', distance: 115 },
  { name: 'นครปฐม', distance: 60 },
  { name: 'นครพนม', distance: 740 },
  { name: 'นครราชสีมา', distance: 260 },
  { name: 'นครศรีธรรมราช', distance: 780 },
  { name: 'นครสวรรค์', distance: 240 },
  { name: 'นนทบุรี', distance: 20 },
  { name: 'นราธิวาส', distance: 1100 },
  { name: 'น่าน', distance: 660 },
  { name: 'บึงกาฬ', distance: 750 },
  { name: 'บุรีรัมย์', distance: 400 },
  { name: 'ปทุมธานี', distance: 40 },
  { name: 'ประจวบคีรีขันธ์', distance: 280 },
  { name: 'ปราจีนบุรี', distance: 135 },
  { name: 'ปัตตานี', distance: 1000 },
  { name: 'พระนครศรีอยุธยา', distance: 80 },
  { name: 'พะเยา', distance: 730 },
  { name: 'พังงา', distance: 780 },
  { name: 'พัทลุง', distance: 840 },
  { name: 'พิจิตร', distance: 340 },
  { name: 'พิษณุโลก', distance: 370 },
  { name: 'เพชรบุรี', distance: 120 },
  { name: 'เพชรบูรณ์', distance: 346 },
  { name: 'แพร่', distance: 550 },
  { name: 'ภูเก็ต', distance: 860 },
  { name: 'มหาสารคาม', distance: 470 },
  { name: 'มุกดาหาร', distance: 640 },
  { name: 'แม่ฮ่องสอน', distance: 900 },
  { name: 'ยโสธร', distance: 530 },
  { name: 'ยะลา', distance: 1000 },
  { name: 'ร้อยเอ็ด', distance: 510 },
  { name: 'ระนอง', distance: 560 },
  { name: 'ระยอง', distance: 140 },
  { name: 'ราชบุรี', distance: 100 },
  { name: 'ลพบุรี', distance: 153 },
  { name: 'ลำปาง', distance: 600 },
  { name: 'ลำพูน', distance: 670 },
  { name: 'เลย', distance: 520 },
  { name: 'ศรีสะเกษ', distance: 515 },
  { name: 'สกลนคร', distance: 640 },
  { name: 'สงขลา', distance: 950 },
  { name: 'สตูล', distance: 970 },
  { name: 'สมุทรปราการ', distance: 25 },
  { name: 'สมุทรสงคราม', distance: 75 },
  { name: 'สมุทรสาคร', distance: 40 },
  { name: 'สระแก้ว', distance: 245 },
  { name: 'สระบุรี', distance: 100 },
  { name: 'สิงห์บุรี', distance: 142 },
  { name: 'สุโขทัย', distance: 420 },
  { name: 'สุพรรณบุรี', distance: 105 },
  { name: 'สุราษฎร์ธานี', distance: 640 },
  { name: 'สุรินทร์', distance: 430 },
  { name: 'หนองคาย', distance: 615 },
  { name: 'หนองบัวลำภู', distance: 530 },
  { name: 'อ่างทอง', distance: 105 },
  { name: 'อำนาจเจริญ', distance: 580 },
  { name: 'อุดรธานี', distance: 560 },
  { name: 'อุตรดิตถ์', distance: 490 },
  { name: 'อุทัยธานี', distance: 222 },
  { name: 'อุบลราชธานี', distance: 600 }
]

const searchProvince = ref('')
const isProvinceDropdownOpen = ref(false)
const provinceDropdownRef = ref(null)

const filteredProvinces = computed(() => {
  if (!searchProvince.value) return provincesList
  const query = searchProvince.value.toLowerCase()
  return provincesList.filter(p => p.name.toLowerCase().includes(query))
})

const selectProvince = (prov) => {
  form.provinceName = prov.name
  form.distance = prov.distance
  isProvinceDropdownOpen.value = false
  searchProvince.value = ''
}

// Handle click outside to close dropdown
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (isProvinceDropdownOpen.value && provinceDropdownRef.value && !provinceDropdownRef.value.contains(e.target)) {
      isProvinceDropdownOpen.value = false
    }
  })
})

const isLoading = ref(false)
const hasCalculated = ref(false)
const isCategoryDropdownOpen = ref(false)
const allProducts = ref([])
const categories = ref([])
const recommendedProducts = ref([])
const alternativeProducts = ref([])

onMounted(async () => {
  try {
    const response = await fetch('/api/products')
    const data = await response.json()
    allProducts.value = data.data || []
    
    // Fetch categories
    const catResponse = await fetch('/api/categories')
    const catData = await catResponse.json()
    categories.value = catData.data || []
  } catch (error) {
    console.error('Failed to load products', error)
  }
})

const calculate = () => {
  if (!form.width || !form.length || !form.height) {
    showToast("กรุณากรอกขนาดพื้นที่ให้ครบถ้วน", 'warning')
    return
  }

  if (!form.provinceName) {
    showToast("กรุณาเลือกจังหวัดที่ติดตั้งเพื่อประเมินค่าจัดส่ง", 'warning')
    return
  }
  isLoading.value = true
  hasCalculated.value = false
  
  setTimeout(async () => {
    const userSpace = { w: form.width, l: form.length, h: form.height, inputType: form.inputType, area: form.area }
    const matches = []
    const alternatives = []

    for (const product of allProducts.value) {
      if (!product.is_active || product.is_out_of_stock) continue;

      // Category filter check (API returns category name in `category` field)
      if (form.categoryName) {
        if (product.category !== form.categoryName) continue;
      }

      // Try to parse dimensions from both size string and product name
      const productDims = parseProductDimensions(product.size, product.name)
      if (!productDims) continue; 

      const fitResult = checkFit(productDims, userSpace)
      const foundationInfo = calculateFoundation(productDims, form.floorType, product)
      const costInfo = estimateInstallation(productDims, form.distance, product, form.provinceName, settingsStore.freeInstallProvinces)
      
      // Find recommended floor panel
      let recommendedFloorPanel = null;
      // Only recommend floor panel if the product actually requires a foundation
      if (product.sku && product.requires_foundation !== false && product.requires_foundation !== 0 && product.requires_foundation !== '0') {
        recommendedFloorPanel = allProducts.value.find(p => 
          (p.name.includes('แผ่นพื้น') || p.name.includes('พื้นรอง')) && 
          p.name.includes(product.sku) && 
          p.id !== product.id
        ) || null;
      }

      const resultObj = {
        product: product,
        fit: fitResult,
        dims: productDims,
        foundation: foundationInfo,
        cost: costInfo,
        recommendedFloorPanel: recommendedFloorPanel
      }

      if (fitResult.fits) {
        matches.push(resultObj)
      } else {
        alternatives.push(resultObj)
      }
    }

    const userArea = userSpace.w * userSpace.l;

    // Sort matches: First by Fit Level (perfect > tight > close)
    // Then by Space Utilization (closest to 1.0 but <= 1.0 is better)
    matches.sort((a, b) => {
      const fitPriority = { 'perfect': 3, 'tight': 2, 'close': 1 };
      const levelDiff = fitPriority[b.fit.level] - fitPriority[a.fit.level];
      if (levelDiff !== 0) return levelDiff;
      
      const areaA = a.dims.w * a.dims.l;
      const areaB = b.dims.w * b.dims.l;
      const utilA = areaA / userArea;
      const utilB = areaB / userArea;
      
      return Math.abs(1 - utilA) - Math.abs(1 - utilB);
    })

    // Sort alternatives by how close they are to fitting
    alternatives.sort((a,b) => {
       const extraA = (a.fit.extraNeeded?.w || 0) + (a.fit.extraNeeded?.l || 0) + (a.fit.extraNeeded?.h || 0);
       const extraB = (b.fit.extraNeeded?.w || 0) + (b.fit.extraNeeded?.l || 0) + (b.fit.extraNeeded?.h || 0);
       return extraA - extraB;
    });
    const topAlternatives = alternatives.slice(0, 3)

    // Calculate shipping cost via API
    const calculateShipping = async (item) => {
      // Handle install cost
      if (form.installMethod === 'self') {
        item.cost.installCost = 0
        item.cost.isSelfInstall = true
      }

      // Handle shipping cost
      if (form.deliveryMethod === 'pickup') {
        item.cost.travelCost = 0
        item.cost.isSelfPickup = true
        return
      }

      try {
        const payload = {
          items: [{ product_id: item.product.id, quantity: 1 }],
          address: { province: form.provinceName, district: '' }
        }
        const res = await apiFetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.success && data.data) {
          item.cost.travelCost = data.data.cost
          item.cost.isRestricted = data.data.is_restricted
        } else {
          item.cost.travelCost = 0
        }
      } catch (e) {
        item.cost.travelCost = 0
      }
    }

    await Promise.all([...matches, ...topAlternatives].map(calculateShipping))

    recommendedProducts.value = matches
    // Take top 3 closest alternatives
    alternativeProducts.value = topAlternatives
    
    hasCalculated.value = true
    isLoading.value = false
  }, 800)
}

const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath
  return `${window.location.origin}${imagePath}`
}

const getParsedImage = (imagesStr) => {
  try {
    if (!imagesStr) return null;
    const parsed = typeof imagesStr === 'string' ? JSON.parse(imagesStr) : imagesStr;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
  } catch(e) {
    return null;
  }
}

const formatPrice = (value) => {
  return Number(value).toLocaleString('th-TH')
}
</script>

<style scoped>
.MixBlendMultiply {
  mix-blend-mode: multiply;
}
@media (prefers-color-scheme: dark) {
  .MixBlendMultiply {
    mix-blend-mode: normal;
  }
}

/* Animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.98);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

/* Hide spin buttons */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Custom Scrollbar for Dropdown */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #4b5563;
}
</style>
