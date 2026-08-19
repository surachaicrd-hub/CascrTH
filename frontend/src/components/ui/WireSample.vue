<script setup>
import { computed, ref } from 'vue'
import { getWireSampleTitle } from '../../utils/wire'

const props = defineProps({
  sample: {
    type: [Object, String],
    required: true
  },
  height: {
    type: [Number, String],
    default: 24
  }
})

const imageLoadError = ref(false)

const sampleType = computed(() => {
  if (typeof props.sample === 'string') return props.sample
  return props.sample?.type || props.sample?.id || props.sample?.name || ''
})

const sampleImage = computed(() => {
  if (typeof props.sample === 'object' && props.sample?.image && !imageLoadError.value) {
    return props.sample.image
  }
  return null
})

const sampleTitle = computed(() => {
  return getWireSampleTitle(props.sample)
})
</script>

<template>
  <div class="w-full flex items-center justify-center my-0.5 select-none" :style="`height: ${height}px;`" :title="sampleTitle">
    <!-- Custom Uploaded Image -->
    <img 
      v-if="sampleImage" 
      :src="sampleImage" 
      :alt="sampleTitle" 
      class="max-h-full max-w-full object-contain rounded-xs"
      @error="imageLoadError = true"
    />

    <!-- ==================== EXACT KODERA / CASTUGNON SVG WIRE GRAPHICS ==================== -->
    <svg v-else class="w-full h-full" viewBox="0 0 200 20" preserveAspectRatio="none" fill="none">
      <defs>
        <!-- Copper Gradient -->
        <linearGradient id="copper-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fbbf24" />
          <stop offset="25%" stop-color="#ea580c" />
          <stop offset="80%" stop-color="#c2410c" />
          <stop offset="100%" stop-color="#9a3412" />
        </linearGradient>

        <!-- Bright Distinct Silver-Grey Jacket Gradient -->
        <linearGradient id="grey-jacket-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="25%" stop-color="#cbd5e1" />
          <stop offset="70%" stop-color="#94a3b8" />
          <stop offset="100%" stop-color="#64748b" />
        </linearGradient>

        <!-- Dark Slate/Black Jacket Gradient -->
        <linearGradient id="black-jacket-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#475569" />
          <stop offset="20%" stop-color="#334155" />
          <stop offset="75%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>

        <!-- Blue Wire Jacket Gradient -->
        <linearGradient id="blue-jacket-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#60a5fa" />
          <stop offset="25%" stop-color="#2563eb" />
          <stop offset="80%" stop-color="#1d4ed8" />
          <stop offset="100%" stop-color="#1e3a8a" />
        </linearGradient>

        <!-- Red Wire Jacket Gradient -->
        <linearGradient id="red-jacket-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f87171" />
          <stop offset="25%" stop-color="#dc2626" />
          <stop offset="80%" stop-color="#b91c1c" />
          <stop offset="100%" stop-color="#7f1d1d" />
        </linearGradient>

        <!-- Yellow Wire Jacket Gradient -->
        <linearGradient id="yellow-jacket-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="30%" stop-color="#eab308" />
          <stop offset="85%" stop-color="#ca8a04" />
          <stop offset="100%" stop-color="#854d0e" />
        </linearGradient>

        <!-- Green Wire Jacket Gradient -->
        <linearGradient id="green-jacket-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#86efac" />
          <stop offset="25%" stop-color="#16a34a" />
          <stop offset="80%" stop-color="#15803d" />
          <stop offset="100%" stop-color="#14532d" />
        </linearGradient>

        <!-- White Wire Jacket Gradient -->
        <linearGradient id="white-jacket-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="30%" stop-color="#f1f5f9" />
          <stop offset="80%" stop-color="#e2e8f0" />
          <stop offset="100%" stop-color="#cbd5e1" />
        </linearGradient>

        <!-- Heavy Duty Thick Cable Gradient -->
        <linearGradient id="thick-jacket-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#64748b" />
          <stop offset="15%" stop-color="#475569" />
          <stop offset="70%" stop-color="#334155" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>

        <!-- Brass Crimp Terminal Gradient -->
        <linearGradient id="brass-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="25%" stop-color="#eab308" />
          <stop offset="70%" stop-color="#ca8a04" />
          <stop offset="100%" stop-color="#854d0e" />
        </linearGradient>

        <!-- Solder Dip Metallic Silver Gradient -->
        <linearGradient id="solder-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="30%" stop-color="#e2e8f0" />
          <stop offset="70%" stop-color="#cbd5e1" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>

        <!-- Yellow/Orange Weather Seal Gradient -->
        <linearGradient id="seal-yellow-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="30%" stop-color="#eab308" />
          <stop offset="80%" stop-color="#ca8a04" />
          <stop offset="100%" stop-color="#713f12" />
        </linearGradient>

        <!-- Corrugated Conduit Tube Rib 3D Gradient -->
        <linearGradient id="corrugated-rib-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#475569" />
          <stop offset="15%" stop-color="#94a3b8" />
          <stop offset="35%" stop-color="#334155" />
          <stop offset="70%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#090d16" />
        </linearGradient>

        <!-- Corrugated Conduit Tube Inner Valley Gradient -->
        <linearGradient id="corrugated-valley-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#020617" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
      </defs>

      <!-- 1. Single Black Wire (สายเดี่ยวสีดำ ปอก 2 ด้าน) -->
      <g v-if="sampleType === 'single_black' || sampleType === 'black' || sampleType === 'single_strip_both'">
        <!-- Left Copper -->
        <rect x="0" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <line x1="0" y1="8" x2="22" y2="8" stroke="#fbbf24" stroke-width="0.7" opacity="0.8" />
        <line x1="0" y1="10" x2="22" y2="10" stroke="#f97316" stroke-width="0.7" opacity="0.6" />
        <line x1="0" y1="12" x2="22" y2="12" stroke="#9a3412" stroke-width="0.7" opacity="0.8" />
        <!-- Main Dark Slate/Black Jacket -->
        <rect x="22" y="4" width="156" height="12" rx="1.5" fill="url(#black-jacket-grad)" />
        <line x1="22" y1="6.5" x2="178" y2="6.5" stroke="#64748b" stroke-width="0.8" opacity="0.6" />
        <!-- Right Copper -->
        <rect x="178" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <line x1="178" y1="8" x2="200" y2="8" stroke="#fbbf24" stroke-width="0.7" opacity="0.8" />
        <line x1="178" y1="10" x2="200" y2="10" stroke="#f97316" stroke-width="0.7" opacity="0.6" />
        <line x1="178" y1="12" x2="200" y2="12" stroke="#9a3412" stroke-width="0.7" opacity="0.8" />
      </g>

      <!-- 1.1 Single Semi-Strip Wire (สายเดี่ยว กึ่งปอกคงปลอก 2 ด้าน / ปอกกึ่งหลุด 2 ด้าน) -->
      <g v-else-if="sampleType === 'single_semi_strip' || sampleType === 'semi_strip_both' || sampleType === 'single_semi_strip_grey' || sampleType === 'single_semi_strip_black' || sampleType === 'single_slug_both' || sampleType === 'slug_both' || sampleType === 'single_semi' || sampleType === 'semi_strip'">
        <!-- Left Slug / Cap (Pulled Jacket Piece) -->
        <rect x="0" y="4" width="16" height="12" rx="1" fill="url(#black-jacket-grad)" />
        <line x1="0" y1="6.5" x2="16" y2="6.5" stroke="#64748b" stroke-width="0.8" opacity="0.6" />

        <!-- Left Exposed Copper Strands -->
        <rect x="16" y="6.5" width="14" height="7" rx="0.5" fill="url(#copper-grad)" />
        <line x1="16" y1="8" x2="30" y2="8" stroke="#fbbf24" stroke-width="0.7" opacity="0.8" />
        <line x1="16" y1="10" x2="30" y2="10" stroke="#f97316" stroke-width="0.7" opacity="0.6" />
        <line x1="16" y1="12" x2="30" y2="12" stroke="#9a3412" stroke-width="0.7" opacity="0.8" />

        <!-- Main Middle Dark Slate/Black Jacket Body -->
        <rect x="30" y="4" width="140" height="12" rx="1.5" fill="url(#black-jacket-grad)" />
        <line x1="30" y1="6.5" x2="170" y2="6.5" stroke="#64748b" stroke-width="0.8" opacity="0.6" />

        <!-- Right Exposed Copper Strands -->
        <rect x="170" y="6.5" width="14" height="7" rx="0.5" fill="url(#copper-grad)" />
        <line x1="170" y1="8" x2="184" y2="8" stroke="#fbbf24" stroke-width="0.7" opacity="0.8" />
        <line x1="170" y1="10" x2="184" y2="10" stroke="#f97316" stroke-width="0.7" opacity="0.6" />
        <line x1="170" y1="12" x2="184" y2="12" stroke="#9a3412" stroke-width="0.7" opacity="0.8" />

        <!-- Right Slug / Cap (Pulled Jacket Piece) -->
        <rect x="184" y="4" width="16" height="12" rx="1" fill="url(#black-jacket-grad)" />
        <line x1="184" y1="6.5" x2="200" y2="6.5" stroke="#64748b" stroke-width="0.8" opacity="0.6" />
      </g>

      <!-- 2. Single Grey Wire (สายเดี่ยวสีเทา ปอก 2 ด้าน - สว่าง ชัดเจน ไม่มืด) -->
      <g v-else-if="sampleType === 'single_grey' || sampleType === 'grey' || sampleType === 'single_strip_grey'">
        <!-- Left Copper -->
        <rect x="0" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <line x1="0" y1="8" x2="22" y2="8" stroke="#fbbf24" stroke-width="0.7" opacity="0.8" />
        <line x1="0" y1="10" x2="22" y2="10" stroke="#f97316" stroke-width="0.7" opacity="0.6" />
        <line x1="0" y1="12" x2="22" y2="12" stroke="#9a3412" stroke-width="0.7" opacity="0.8" />
        <!-- Main Silver-Grey Jacket -->
        <rect x="22" y="4" width="156" height="12" rx="1.5" fill="url(#grey-jacket-grad)" stroke="#94a3b8" stroke-width="0.6" />
        <line x1="22" y1="6.5" x2="178" y2="6.5" stroke="#ffffff" stroke-width="0.9" opacity="0.9" />
        <!-- Right Copper -->
        <rect x="178" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <line x1="178" y1="8" x2="200" y2="8" stroke="#fbbf24" stroke-width="0.7" opacity="0.8" />
        <line x1="178" y1="10" x2="200" y2="10" stroke="#f97316" stroke-width="0.7" opacity="0.6" />
        <line x1="178" y1="12" x2="200" y2="12" stroke="#9a3412" stroke-width="0.7" opacity="0.8" />
      </g>

      <!-- 2. Single Blue Wire (สายเดี่ยวสีน้ำเงิน ปอก 2 ด้าน) -->
      <g v-else-if="sampleType === 'single_blue' || sampleType === 'blue' || sampleType === 'single_strip_blue'">
        <rect x="0" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <line x1="0" y1="8" x2="22" y2="8" stroke="#fbbf24" stroke-width="0.7" opacity="0.8" />
        <rect x="22" y="4" width="156" height="12" rx="1.5" fill="url(#blue-jacket-grad)" />
        <line x1="22" y1="6.5" x2="178" y2="6.5" stroke="#93c5fd" stroke-width="0.8" opacity="0.7" />
        <rect x="178" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <line x1="178" y1="8" x2="200" y2="8" stroke="#fbbf24" stroke-width="0.7" opacity="0.8" />
      </g>

      <!-- 3. Single Red Wire (สายเดี่ยวสีแดง ปอก 2 ด้าน) -->
      <g v-else-if="sampleType === 'single_red' || sampleType === 'red' || sampleType === 'single_strip_red'">
        <rect x="0" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <line x1="0" y1="8" x2="22" y2="8" stroke="#fbbf24" stroke-width="0.7" opacity="0.8" />
        <rect x="22" y="4" width="156" height="12" rx="1.5" fill="url(#red-jacket-grad)" />
        <line x1="22" y1="6.5" x2="178" y2="6.5" stroke="#fca5a5" stroke-width="0.8" opacity="0.7" />
        <rect x="178" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <line x1="178" y1="8" x2="200" y2="8" stroke="#fbbf24" stroke-width="0.7" opacity="0.8" />
      </g>

      <!-- 4. Single Yellow Wire (สายเดี่ยวสีเหลือง ปอก 2 ด้าน) -->
      <g v-else-if="sampleType === 'single_yellow' || sampleType === 'yellow' || sampleType === 'single_strip_yellow'">
        <rect x="0" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <rect x="22" y="4" width="156" height="12" rx="1.5" fill="url(#yellow-jacket-grad)" />
        <line x1="22" y1="6.5" x2="178" y2="6.5" stroke="#fef9c3" stroke-width="0.8" opacity="0.8" />
        <rect x="178" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
      </g>

      <!-- 5. Single Green Wire (สายเดี่ยวสีเขียว ปอก 2 ด้าน) -->
      <g v-else-if="sampleType === 'single_green' || sampleType === 'green' || sampleType === 'single_strip_green'">
        <rect x="0" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <rect x="22" y="4" width="156" height="12" rx="1.5" fill="url(#green-jacket-grad)" />
        <line x1="22" y1="6.5" x2="178" y2="6.5" stroke="#bbf7d0" stroke-width="0.8" opacity="0.7" />
        <rect x="178" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
      </g>

      <!-- 6. Single White Wire (สายเดี่ยวสีขาว ปอก 2 ด้าน) -->
      <g v-else-if="sampleType === 'single_white' || sampleType === 'white'">
        <rect x="0" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <rect x="22" y="4" width="156" height="12" rx="1.5" fill="url(#white-jacket-grad)" stroke="#94a3b8" stroke-width="0.6" />
        <line x1="22" y1="6.5" x2="178" y2="6.5" stroke="#ffffff" stroke-width="0.8" />
        <rect x="178" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
      </g>

      <!-- 7. Ground Yellow-Green Wire (สายดินเขียว-เหลือง - C370G) -->
      <g v-else-if="sampleType === 'ground_yellow_green' || sampleType === 'ground' || sampleType === 'single_ground'">
        <rect x="0" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <rect x="22" y="4" width="156" height="12" rx="1.5" fill="#eab308" />
        <rect x="22" y="6.5" width="156" height="6" fill="#16a34a" />
        <line x1="22" y1="7.5" x2="178" y2="7.5" stroke="#4ade80" stroke-width="0.8" opacity="0.7" />
        <rect x="178" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
      </g>

      <!-- 8. Multi-Window Mid Stripping (ปอกกลางสายหลายช่วง - C371G, C373G, C381G) -->
      <g v-else-if="sampleType === 'mid_strip_multi' || sampleType === 'single_mid_strip' || sampleType === 'strip_mid'">
        <!-- Left Copper Tip -->
        <rect x="0" y="6.5" width="14" height="7" rx="0.5" fill="url(#copper-grad)" />
        <!-- Segment 1 -->
        <rect x="14" y="4" width="30" height="12" rx="1" fill="url(#grey-jacket-grad)" />
        <line x1="14" y1="6.5" x2="44" y2="6.5" stroke="#94a3b8" stroke-width="0.7" opacity="0.6" />
        <!-- Mid Window 1 -->
        <rect x="44" y="6.5" width="18" height="7" fill="url(#copper-grad)" />
        <!-- Segment 2 -->
        <rect x="62" y="4" width="32" height="12" rx="1" fill="url(#grey-jacket-grad)" />
        <line x1="62" y1="6.5" x2="94" y2="6.5" stroke="#94a3b8" stroke-width="0.7" opacity="0.6" />
        <!-- Mid Window 2 -->
        <rect x="94" y="6.5" width="18" height="7" fill="url(#copper-grad)" />
        <!-- Segment 3 -->
        <rect x="112" y="4" width="32" height="12" rx="1" fill="url(#grey-jacket-grad)" />
        <line x1="112" y1="6.5" x2="144" y2="6.5" stroke="#94a3b8" stroke-width="0.7" opacity="0.6" />
        <!-- Mid Window 3 -->
        <rect x="144" y="6.5" width="18" height="7" fill="url(#copper-grad)" />
        <!-- Segment 4 -->
        <rect x="162" y="4" width="24" height="12" rx="1" fill="url(#grey-jacket-grad)" />
        <line x1="162" y1="6.5" x2="186" y2="6.5" stroke="#94a3b8" stroke-width="0.7" opacity="0.6" />
        <!-- Right Copper Tip -->
        <rect x="186" y="6.5" width="14" height="7" rx="0.5" fill="url(#copper-grad)" />
      </g>

      <!-- 9. 2-Core Round Cable Sheath Stripped (สายคู่ 2 คอร์ ปอกเปลือกนอก - C371G, C373G, C381G) -->
      <g v-else-if="sampleType === 'twocore_sheath_strip' || sampleType === 'twocore_cable'">
        <!-- Left 2 Wires (Top Blue, Bottom Brown/Orange) -->
        <rect x="0" y="4" width="8" height="3" fill="url(#copper-grad)" />
        <rect x="8" y="3.5" width="22" height="4" rx="0.5" fill="url(#blue-jacket-grad)" />
        <rect x="0" y="13" width="8" height="3" fill="url(#copper-grad)" />
        <rect x="8" y="12.5" width="22" height="4" rx="0.5" fill="url(#copper-grad)" />
        <!-- Center Main Sheath -->
        <rect x="30" y="3" width="140" height="14" rx="2" fill="url(#grey-jacket-grad)" />
        <line x1="30" y1="5.5" x2="170" y2="5.5" stroke="#94a3b8" stroke-width="0.8" opacity="0.6" />
        <!-- Right 2 Wires (Top Blue, Bottom Brown/Orange) -->
        <rect x="170" y="3.5" width="22" height="4" rx="0.5" fill="url(#blue-jacket-grad)" />
        <rect x="192" y="4" width="8" height="3" fill="url(#copper-grad)" />
        <rect x="170" y="12.5" width="22" height="4" rx="0.5" fill="url(#copper-grad)" />
        <rect x="192" y="13" width="8" height="3" fill="url(#copper-grad)" />
      </g>

      <!-- 10. Y-Branch Split Wire (สายแยก 2 แฉก - C371G, C373G) -->
      <g v-else-if="sampleType === 'twocore_split_y' || sampleType === 'split_wire' || sampleType === 'y_branch'">
        <!-- Left Fork Arms -->
        <rect x="0" y="1" width="14" height="4" rx="0.5" fill="url(#copper-grad)" />
        <path d="M14 3 Q36 3.5, 60 7" stroke="#334155" stroke-width="4.5" fill="none" stroke-linecap="round" />
        <path d="M14 3 Q36 3.5, 60 7" stroke="#64748b" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.6" />
        
        <rect x="0" y="15" width="14" height="4" rx="0.5" fill="url(#copper-grad)" />
        <path d="M14 17 Q36 16.5, 60 13" stroke="#334155" stroke-width="4.5" fill="none" stroke-linecap="round" />
        <path d="M14 17 Q36 16.5, 60 13" stroke="#64748b" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.6" />
        
        <!-- Center Main Jacket Joint -->
        <rect x="60" y="5" width="80" height="10" rx="1.5" fill="url(#grey-jacket-grad)" />
        <line x1="60" y1="7.5" x2="140" y2="7.5" stroke="#94a3b8" stroke-width="0.8" opacity="0.6" />

        <!-- Right Fork Arms -->
        <path d="M140 7 Q164 3.5, 186 3" stroke="#334155" stroke-width="4.5" fill="none" stroke-linecap="round" />
        <path d="M140 7 Q164 3.5, 186 3" stroke="#64748b" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.6" />
        <rect x="186" y="1" width="14" height="4" rx="0.5" fill="url(#copper-grad)" />

        <path d="M140 13 Q164 16.5, 186 17" stroke="#334155" stroke-width="4.5" fill="none" stroke-linecap="round" />
        <path d="M140 13 Q164 16.5, 186 17" stroke="#64748b" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.6" />
        <rect x="186" y="15" width="14" height="4" rx="0.5" fill="url(#copper-grad)" />
      </g>

      <!-- 11. Twisted Pair (สายไฟคู่ตีเกลียว) -->
      <g v-else-if="sampleType === 'twisted_pair' || sampleType === 'twist'">
        <rect x="0" y="4.5" width="14" height="3" rx="0.5" fill="url(#copper-grad)" />
        <rect x="0" y="12.5" width="14" height="3" rx="0.5" fill="url(#copper-grad)" />
        <path d="M14 6 Q34 1, 54 6 T94 6 T134 6 T164 6 T186 6" stroke="#1e293b" stroke-width="5" fill="none" stroke-linecap="round" />
        <path d="M14 14 Q34 19, 54 14 T94 14 T134 14 T164 14 T186 14" stroke="#2563eb" stroke-width="5" fill="none" stroke-linecap="round" />
        <path d="M14 6 Q34 1, 54 6 T94 6 T134 6 T164 6 T186 6" stroke="#64748b" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.6" />
        <path d="M14 14 Q34 19, 54 14 T94 14 T134 14 T164 14 T186 14" stroke="#93c5fd" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.6" />
        <rect x="186" y="4.5" width="14" height="3" rx="0.5" fill="url(#copper-grad)" />
        <rect x="186" y="12.5" width="14" height="3" rx="0.5" fill="url(#copper-grad)" />
      </g>

      <!-- 12. Flat Ribbon Fanned Out Split (สายแพแบนแยกเส้นหลายสาย - Slit & Strip Both Ends) -->
      <g v-else-if="sampleType === 'flat_ribbon_split' || sampleType === 'ribbon_split' || sampleType === 'flat_ribbon_slit'">
        <!-- Left 4 Flared Strands -->
        <!-- Strand 1 (Top) -->
        <line x1="1" y1="2.2" x2="16" y2="4.0" stroke="url(#copper-grad)" stroke-width="2.1" stroke-linecap="round" />
        <line x1="16" y1="4.0" x2="36" y2="5.5" stroke="#475569" stroke-width="2.7" stroke-linecap="round" />
        
        <!-- Strand 2 (Upper-Mid) -->
        <line x1="3" y1="6.2" x2="18" y2="7.0" stroke="url(#copper-grad)" stroke-width="2.1" stroke-linecap="round" />
        <line x1="18" y1="7.0" x2="36" y2="8.4" stroke="#475569" stroke-width="2.7" stroke-linecap="round" />

        <!-- Strand 3 (Lower-Mid) -->
        <line x1="3" y1="13.8" x2="18" y2="13.0" stroke="url(#copper-grad)" stroke-width="2.1" stroke-linecap="round" />
        <line x1="18" y1="13.0" x2="36" y2="11.6" stroke="#475569" stroke-width="2.7" stroke-linecap="round" />

        <!-- Strand 4 (Bottom) -->
        <line x1="1" y1="17.8" x2="16" y2="16.0" stroke="url(#copper-grad)" stroke-width="2.1" stroke-linecap="round" />
        <line x1="16" y1="16.0" x2="36" y2="14.5" stroke="#475569" stroke-width="2.7" stroke-linecap="round" />

        <!-- Center Ribbon Body (4 bonded conductors) -->
        <rect x="36" y="3.8" width="128" height="12.4" rx="0.8" fill="url(#black-jacket-grad)" />
        <line x1="36" y1="6.9" x2="164" y2="6.9" stroke="#1e293b" stroke-width="0.7" />
        <line x1="36" y1="10.0" x2="164" y2="10.0" stroke="#1e293b" stroke-width="0.7" />
        <line x1="36" y1="13.1" x2="164" y2="13.1" stroke="#1e293b" stroke-width="0.7" />
        <line x1="36" y1="4.8" x2="164" y2="4.8" stroke="#64748b" stroke-width="0.6" opacity="0.6" />

        <!-- Right 4 Flared Strands (Symmetric) -->
        <!-- Strand 1 (Top) -->
        <line x1="164" y1="5.5" x2="184" y2="4.0" stroke="#475569" stroke-width="2.7" stroke-linecap="round" />
        <line x1="184" y1="4.0" x2="199" y2="2.2" stroke="url(#copper-grad)" stroke-width="2.1" stroke-linecap="round" />

        <!-- Strand 2 (Upper-Mid) -->
        <line x1="164" y1="8.4" x2="182" y2="7.0" stroke="#475569" stroke-width="2.7" stroke-linecap="round" />
        <line x1="182" y1="7.0" x2="197" y2="6.2" stroke="url(#copper-grad)" stroke-width="2.1" stroke-linecap="round" />

        <!-- Strand 3 (Lower-Mid) -->
        <line x1="164" y1="11.6" x2="182" y2="13.0" stroke="#475569" stroke-width="2.7" stroke-linecap="round" />
        <line x1="182" y1="13.0" x2="197" y2="13.8" stroke="url(#copper-grad)" stroke-width="2.1" stroke-linecap="round" />

        <!-- Strand 4 (Bottom) -->
        <line x1="164" y1="14.5" x2="184" y2="16.0" stroke="#475569" stroke-width="2.7" stroke-linecap="round" />
        <line x1="184" y1="16.0" x2="199" y2="17.8" stroke="url(#copper-grad)" stroke-width="2.1" stroke-linecap="round" />
      </g>

      <!-- 13. Flat Ribbon Semi-Strip / Slug Retention (สายแพแบน กึ่งปอกคงปลอกปลาย 2 ด้าน) -->
      <g v-else-if="sampleType === 'flat_ribbon_semi_strip' || sampleType === 'ribbon_semi_strip' || sampleType === 'flat_ribbon_slug' || sampleType === 'flat_semi_strip' || sampleType === 'ribbon_semi'">
        <!-- Left Slug / Cap (Insulation piece at tip) -->
        <rect x="0" y="3.8" width="16" height="12.4" rx="0.5" fill="url(#black-jacket-grad)" />
        <line x1="0" y1="6.9" x2="16" y2="6.9" stroke="#1e293b" stroke-width="0.7" />
        <line x1="0" y1="10.0" x2="16" y2="10.0" stroke="#1e293b" stroke-width="0.7" />
        <line x1="0" y1="13.1" x2="16" y2="13.1" stroke="#1e293b" stroke-width="0.7" />
        <line x1="0" y1="4.8" x2="16" y2="4.8" stroke="#64748b" stroke-width="0.6" opacity="0.6" />

        <!-- Left Exposed Copper Conductors (4 parallel cores) -->
        <rect x="16" y="4.5" width="22" height="2.0" fill="url(#copper-grad)" />
        <rect x="16" y="7.6" width="22" height="2.0" fill="url(#copper-grad)" />
        <rect x="16" y="10.7" width="22" height="2.0" fill="url(#copper-grad)" />
        <rect x="16" y="13.8" width="22" height="2.0" fill="url(#copper-grad)" />

        <!-- Center Ribbon Body (Main Jacket) -->
        <rect x="38" y="3.8" width="124" height="12.4" rx="0.5" fill="url(#black-jacket-grad)" />
        <line x1="38" y1="6.9" x2="162" y2="6.9" stroke="#1e293b" stroke-width="0.7" />
        <line x1="38" y1="10.0" x2="162" y2="10.0" stroke="#1e293b" stroke-width="0.7" />
        <line x1="38" y1="13.1" x2="162" y2="13.1" stroke="#1e293b" stroke-width="0.7" />
        <line x1="38" y1="4.8" x2="162" y2="4.8" stroke="#64748b" stroke-width="0.6" opacity="0.6" />

        <!-- Right Exposed Copper Conductors (4 parallel cores) -->
        <rect x="162" y="4.5" width="22" height="2.0" fill="url(#copper-grad)" />
        <rect x="162" y="7.6" width="22" height="2.0" fill="url(#copper-grad)" />
        <rect x="162" y="10.7" width="22" height="2.0" fill="url(#copper-grad)" />
        <rect x="162" y="13.8" width="22" height="2.0" fill="url(#copper-grad)" />

        <!-- Right Slug / Cap (Insulation piece at tip) -->
        <rect x="184" y="3.8" width="16" height="12.4" rx="0.5" fill="url(#black-jacket-grad)" />
        <line x1="184" y1="6.9" x2="200" y2="6.9" stroke="#1e293b" stroke-width="0.7" />
        <line x1="184" y1="10.0" x2="200" y2="10.0" stroke="#1e293b" stroke-width="0.7" />
        <line x1="184" y1="13.1" x2="200" y2="13.1" stroke="#1e293b" stroke-width="0.7" />
        <line x1="184" y1="4.8" x2="200" y2="4.8" stroke="#64748b" stroke-width="0.6" opacity="0.6" />
      </g>

      <!-- 14. Flat Ribbon Grey (สายแพแบนสีเทา ปอกปลาย 2 ด้าน - C371AG, C373AG) -->
      <g v-else-if="sampleType === 'flat_ribbon_grey' || sampleType === 'ribbon_grey' || sampleType === 'flat_ribbon_strip'">
        <!-- Left 4 Copper Pins -->
        <rect x="0" y="4.5" width="20" height="2.0" fill="url(#copper-grad)" />
        <rect x="0" y="7.6" width="20" height="2.0" fill="url(#copper-grad)" />
        <rect x="0" y="10.7" width="20" height="2.0" fill="url(#copper-grad)" />
        <rect x="0" y="13.8" width="20" height="2.0" fill="url(#copper-grad)" />
        <!-- Main Ribbon Body -->
        <rect x="20" y="3.8" width="160" height="12.4" rx="0.5" fill="url(#grey-jacket-grad)" stroke="#94a3b8" stroke-width="0.5" />
        <line x1="20" y1="6.9" x2="180" y2="6.9" stroke="#1e293b" stroke-width="0.7" />
        <line x1="20" y1="10.0" x2="180" y2="10.0" stroke="#1e293b" stroke-width="0.7" />
        <line x1="20" y1="13.1" x2="180" y2="13.1" stroke="#1e293b" stroke-width="0.7" />
        <line x1="20" y1="4.8" x2="180" y2="4.8" stroke="#ffffff" stroke-width="0.6" opacity="0.8" />
        <!-- Right 4 Copper Pins -->
        <rect x="180" y="4.5" width="20" height="2.0" fill="url(#copper-grad)" />
        <rect x="180" y="7.6" width="20" height="2.0" fill="url(#copper-grad)" />
        <rect x="180" y="10.7" width="20" height="2.0" fill="url(#copper-grad)" />
        <rect x="180" y="13.8" width="20" height="2.0" fill="url(#copper-grad)" />
      </g>

      <!-- 14. Flat Ribbon Rainbow (สายแพแบน สีรุ้ง ปอกปลาย 2 ด้าน) -->
      <g v-else-if="sampleType === 'flat_ribbon_rainbow' || sampleType === 'ribbon_rainbow' || sampleType === 'rainbow'">
        <!-- Left 6 Copper Pins -->
        <rect x="0" y="2.5" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
        <rect x="0" y="5.1" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
        <rect x="0" y="7.7" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
        <rect x="0" y="10.3" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
        <rect x="0" y="12.9" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
        <rect x="0" y="15.5" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />

        <!-- 6 Rainbow Strands -->
        <rect x="16" y="2.0" width="168" height="2.6" fill="#ef4444" />
        <rect x="16" y="4.6" width="168" height="2.6" fill="#f97316" />
        <rect x="16" y="7.2" width="168" height="2.6" fill="#eab308" />
        <rect x="16" y="9.8" width="168" height="2.6" fill="#22c55e" />
        <rect x="16" y="12.4" width="168" height="2.6" fill="#3b82f6" />
        <rect x="16" y="15.0" width="168" height="2.6" fill="#a855f7" />

        <!-- Seam Separator Lines -->
        <line x1="16" y1="4.6" x2="184" y2="4.6" stroke="#000000" stroke-width="0.5" opacity="0.35" />
        <line x1="16" y1="7.2" x2="184" y2="7.2" stroke="#000000" stroke-width="0.5" opacity="0.35" />
        <line x1="16" y1="9.8" x2="184" y2="9.8" stroke="#000000" stroke-width="0.5" opacity="0.35" />
        <line x1="16" y1="12.4" x2="184" y2="12.4" stroke="#000000" stroke-width="0.5" opacity="0.35" />
        <line x1="16" y1="15.0" x2="184" y2="15.0" stroke="#000000" stroke-width="0.5" opacity="0.35" />
        <!-- Top Cylindrical Highlight -->
        <line x1="16" y1="2.8" x2="184" y2="2.8" stroke="#ffffff" stroke-width="0.6" opacity="0.6" />

        <!-- Right 6 Copper Pins -->
        <rect x="184" y="2.5" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
        <rect x="184" y="5.1" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
        <rect x="184" y="7.7" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
        <rect x="184" y="10.3" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
        <rect x="184" y="12.9" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
        <rect x="184" y="15.5" width="16" height="1.8" rx="0.5" fill="url(#copper-grad)" />
      </g>

      <!-- 15. Corrugated Tube (ท่อร้อยสายไฟลูกฟูก - C372G) -->
      <g v-else-if="sampleType === 'corrugated_tube' || sampleType === 'corrugated' || sampleType === 'tube'">
        <!-- Horizontal Inner Connecting Core (Valleys) -->
        <rect x="0" y="4.5" width="200" height="11" fill="#71717a" />

        <!-- Vertical Corrugated Rib Teeth (Crests) -->
        <g>
          <rect
            v-for="i in 44"
            :key="'crg-tooth-'+i"
            :x="(i - 1) * 4.55"
            y="2"
            width="2.5"
            height="16"
            rx="0.2"
            fill="#3f3f46"
          />
        </g>
      </g>

      <!-- 16. Thick Heavy Cable 50 SQ (สายไฟขนาดใหญ่ 50 SQ - C376G) -->
      <g v-else-if="sampleType === 'thick_cable_50sq' || sampleType === '50sq' || sampleType === 'c376g'">
        <!-- Left Heavy Copper -->
        <rect x="0" y="4.5" width="24" height="11" rx="0.5" fill="url(#copper-grad)" />
        <line x1="0" y1="7" x2="24" y2="7" stroke="#fbbf24" stroke-width="1" opacity="0.8" />
        <line x1="0" y1="13" x2="24" y2="13" stroke="#9a3412" stroke-width="1" opacity="0.8" />
        <!-- Main Thick Jacket with 50 SQ Text -->
        <rect x="24" y="1.5" width="152" height="17" rx="2" fill="url(#thick-jacket-grad)" />
        <line x1="24" y1="4.5" x2="176" y2="4.5" stroke="#94a3b8" stroke-width="0.8" opacity="0.6" />
        <text x="100" y="13" fill="#ffffff" font-size="9" font-weight="900" font-family="'Inter', sans-serif" text-anchor="middle" letter-spacing="1">50 SQ</text>
        <!-- Right Heavy Copper -->
        <rect x="176" y="4.5" width="24" height="11" rx="0.5" fill="url(#copper-grad)" />
        <line x1="176" y1="7" x2="200" y2="7" stroke="#fbbf24" stroke-width="1" opacity="0.8" />
        <line x1="176" y1="13" x2="200" y2="13" stroke="#9a3412" stroke-width="1" opacity="0.8" />
      </g>

      <!-- 17. Thick Heavy Cable 80 SQ (สายไฟขนาดใหญ่ 80 SQ - C377A / C377G) -->
      <g v-else-if="sampleType === 'thick_cable_80sq' || sampleType === '80sq' || sampleType === 'c377g'">
        <rect x="0" y="4" width="24" height="12" rx="0.5" fill="url(#copper-grad)" />
        <line x1="0" y1="7" x2="24" y2="7" stroke="#fbbf24" stroke-width="1" opacity="0.8" />
        <rect x="24" y="1" width="152" height="18" rx="2" fill="url(#thick-jacket-grad)" />
        <line x1="24" y1="4.5" x2="176" y2="4.5" stroke="#94a3b8" stroke-width="0.8" opacity="0.6" />
        <text x="100" y="13.5" fill="#ffffff" font-size="9.5" font-weight="900" font-family="'Inter', sans-serif" text-anchor="middle" letter-spacing="1">80 SQ</text>
        <rect x="176" y="4" width="24" height="12" rx="0.5" fill="url(#copper-grad)" />
        <line x1="176" y1="7" x2="200" y2="7" stroke="#fbbf24" stroke-width="1" opacity="0.8" />
      </g>

      <!-- 18. Ultra Heavy Cable 200 SQ (สายไฟขนาดใหญ่พิเศษ 200 SQ - C378) -->
      <g v-else-if="sampleType === 'thick_cable_200sq' || sampleType === '200sq' || sampleType === 'c378'">
        <rect x="0" y="3.5" width="25" height="13" rx="0.5" fill="url(#copper-grad)" />
        <line x1="0" y1="7" x2="25" y2="7" stroke="#fbbf24" stroke-width="1.2" opacity="0.8" />
        <line x1="0" y1="13" x2="25" y2="13" stroke="#9a3412" stroke-width="1.2" opacity="0.8" />
        <rect x="25" y="0.5" width="150" height="19" rx="2" fill="url(#black-jacket-grad)" />
        <line x1="25" y1="3.5" x2="175" y2="3.5" stroke="#94a3b8" stroke-width="1" opacity="0.6" />
        <text x="100" y="13.5" fill="#ffffff" font-size="10" font-weight="900" font-family="'Inter', sans-serif" text-anchor="middle" letter-spacing="1.5">200 SQ</text>
        <rect x="175" y="3.5" width="25" height="13" rx="0.5" fill="url(#copper-grad)" />
        <line x1="175" y1="7" x2="200" y2="7" stroke="#fbbf24" stroke-width="1.2" opacity="0.8" />
      </g>

      <!-- 19. Multi Core Cable with Label (สายมัลติคอร์ MULTI CORE - C385G) -->
      <g v-else-if="sampleType === 'multicore_cable' || sampleType === 'c385g_multicore' || sampleType === 'shielded_multicore' || sampleType === 'multicore'">
        <!-- Left 4 Inner Wires -->
        <rect x="0" y="3" width="6" height="2" fill="url(#copper-grad)" />
        <rect x="6" y="2.5" width="24" height="2.5" fill="#eab308" />
        
        <rect x="0" y="6.5" width="6" height="2" fill="url(#copper-grad)" />
        <rect x="6" y="6" width="24" height="2.5" fill="#dc2626" />
        
        <rect x="0" y="11" width="6" height="2" fill="url(#copper-grad)" />
        <rect x="6" y="10.5" width="24" height="2.5" fill="#2563eb" />
        
        <rect x="0" y="14.5" width="6" height="2" fill="url(#copper-grad)" />
        <rect x="6" y="14" width="24" height="2.5" fill="#16a34a" />

        <!-- Main Outer Jacket with MULTI CORE text -->
        <rect x="30" y="2" width="140" height="16" rx="2" fill="url(#grey-jacket-grad)" />
        <line x1="30" y1="4.5" x2="170" y2="4.5" stroke="#94a3b8" stroke-width="0.8" opacity="0.6" />
        <text x="100" y="13" fill="#ffffff" font-size="8.5" font-weight="900" font-family="'Inter', sans-serif" text-anchor="middle" letter-spacing="1">MULTI CORE</text>

        <!-- Right 4 Inner Wires -->
        <rect x="170" y="2.5" width="24" height="2.5" fill="#eab308" />
        <rect x="194" y="3" width="6" height="2" fill="url(#copper-grad)" />
        
        <rect x="170" y="6" width="24" height="2.5" fill="#dc2626" />
        <rect x="194" y="6.5" width="6" height="2" fill="url(#copper-grad)" />
        
        <rect x="170" y="10.5" width="24" height="2.5" fill="#2563eb" />
        <rect x="194" y="11" width="6" height="2" fill="url(#copper-grad)" />
        
        <rect x="170" y="14" width="24" height="2.5" fill="#16a34a" />
        <rect x="194" y="14.5" width="6" height="2" fill="url(#copper-grad)" />
      </g>

      <!-- 20. Coaxial Cable (สายสัญญาณโคแอกเชียล) -->
      <g v-else-if="sampleType === 'coaxial' || sampleType === 'coax'">
        <rect x="0" y="8" width="22" height="4" rx="0.5" fill="url(#copper-grad)" />
        <rect x="22" y="6" width="20" height="8" rx="1" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.8" />
        <rect x="42" y="4.5" width="20" height="11" rx="1" fill="#94a3b8" />
        <rect x="62" y="3" width="76" height="14" rx="2" fill="url(#black-jacket-grad)" />
        <line x1="62" y1="5.5" x2="138" y2="5.5" stroke="#94a3b8" stroke-width="0.8" opacity="0.6" />
        <rect x="138" y="4.5" width="20" height="11" rx="1" fill="#94a3b8" />
        <rect x="158" y="6" width="20" height="8" rx="1" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.8" />
        <rect x="178" y="8" width="22" height="4" rx="0.5" fill="url(#copper-grad)" />
      </g>

      <!-- 21. C558SSA: Double Crimp Terminals + Double Silicone Seals (เครื่องปอกย้ำ 2 ด้าน + ใส่ซีล 2 ด้าน) -->
      <g v-else-if="sampleType === 'crimp_double_seal' || sampleType === 'c558ssa'">
        <!-- Left Brass Terminal -->
        <polygon points="0,5 14,5 18,7.5 18,12.5 14,15 0,15 4,10" fill="url(#brass-grad)" stroke="#a16207" stroke-width="0.6" />
        <circle cx="8" cy="10" r="2.2" fill="#713f12" />
        <!-- Left Yellow/Orange Weather Seal -->
        <rect x="18" y="3" width="16" height="14" rx="3" fill="url(#seal-yellow-grad)" stroke="#a16207" stroke-width="0.6" />
        <line x1="23" y1="3" x2="23" y2="17" stroke="#713f12" stroke-width="1" />
        <line x1="28" y1="3" x2="28" y2="17" stroke="#713f12" stroke-width="1" />
        <!-- Red Wire Body -->
        <rect x="34" y="5.5" width="132" height="9" rx="1.5" fill="url(#red-jacket-grad)" />
        <line x1="34" y1="7.5" x2="166" y2="7.5" stroke="#fca5a5" stroke-width="0.8" opacity="0.8" />
        <!-- Right Yellow/Orange Weather Seal -->
        <rect x="166" y="3" width="16" height="14" rx="3" fill="url(#seal-yellow-grad)" stroke="#a16207" stroke-width="0.6" />
        <line x1="171" y1="3" x2="171" y2="17" stroke="#713f12" stroke-width="1" />
        <line x1="176" y1="3" x2="176" y2="17" stroke="#713f12" stroke-width="1" />
        <!-- Right Brass Terminal -->
        <polygon points="200,5 186,5 182,7.5 182,12.5 186,15 200,15 196,10" fill="url(#brass-grad)" stroke="#a16207" stroke-width="0.6" />
        <circle cx="192" cy="10" r="2.2" fill="#713f12" />
      </g>

      <!-- 22. C511e / C551HXG: Double Ends Crimping (เครื่องตัดปอกย้ำ 2 ด้าน) -->
      <g v-else-if="sampleType === 'crimp_double' || sampleType === 'c511e' || sampleType === 'c551hxg'">
        <!-- Left Brass Terminal -->
        <polygon points="0,5 16,5 22,7.5 22,12.5 16,15 0,15 4,10" fill="url(#brass-grad)" stroke="#a16207" stroke-width="0.6" />
        <circle cx="9" cy="10" r="2.2" fill="#713f12" />
        <!-- Red Wire Body -->
        <rect x="22" y="5.5" width="156" height="9" rx="1.5" fill="url(#red-jacket-grad)" />
        <line x1="22" y1="7.5" x2="178" y2="7.5" stroke="#fca5a5" stroke-width="0.8" opacity="0.8" />
        <!-- Right Brass Terminal -->
        <polygon points="200,5 184,5 178,7.5 178,12.5 184,15 200,15 196,10" fill="url(#brass-grad)" stroke="#a16207" stroke-width="0.6" />
        <circle cx="191" cy="10" r="2.2" fill="#713f12" />
      </g>

      <!-- 23. C515e: Double Crimp + Single Seal (เครื่องย้ำ 2 ด้าน + ใส่ซีล 1 ด้าน) -->
      <g v-else-if="sampleType === 'crimp_double_single_seal' || sampleType === 'c515e'">
        <!-- Left Brass Terminal -->
        <polygon points="0,5 14,5 18,7.5 18,12.5 14,15 0,15 4,10" fill="url(#brass-grad)" stroke="#a16207" stroke-width="0.6" />
        <circle cx="8" cy="10" r="2.2" fill="#713f12" />
        <!-- Left Weather Seal -->
        <rect x="18" y="3" width="16" height="14" rx="3" fill="url(#seal-yellow-grad)" stroke="#a16207" stroke-width="0.6" />
        <line x1="23" y1="3" x2="23" y2="17" stroke="#713f12" stroke-width="1" />
        <!-- Red Wire Body -->
        <rect x="34" y="5.5" width="144" height="9" rx="1.5" fill="url(#red-jacket-grad)" />
        <line x1="34" y1="7.5" x2="178" y2="7.5" stroke="#fca5a5" stroke-width="0.8" opacity="0.8" />
        <!-- Right Brass Terminal (No seal) -->
        <polygon points="200,5 184,5 178,7.5 178,12.5 184,15 200,15 196,10" fill="url(#brass-grad)" stroke="#a16207" stroke-width="0.6" />
        <circle cx="191" cy="10" r="2.2" fill="#713f12" />
      </g>

      <!-- 24. C550SZe: Single Crimp + Single Solder Dipping (ย้ำ 1 ด้าน + จุ่มตะกั่ว 1 ด้าน) -->
      <g v-else-if="sampleType === 'crimp_single_tin_single' || sampleType === 'c550sze'">
        <!-- Left Brass Terminal -->
        <polygon points="0,5 16,5 22,7.5 22,12.5 16,15 0,15 4,10" fill="url(#brass-grad)" stroke="#a16207" stroke-width="0.6" />
        <circle cx="9" cy="10" r="2.2" fill="#713f12" />
        <!-- Red Wire Body -->
        <rect x="22" y="5.5" width="150" height="9" rx="1.5" fill="url(#red-jacket-grad)" />
        <line x1="22" y1="7.5" x2="172" y2="7.5" stroke="#fca5a5" stroke-width="0.8" opacity="0.8" />
        <!-- Right Solder Dipped Tip (Silver molten bulb) -->
        <path d="M172 6.5 L190 6.5 Q200 6.5, 200 10 Q200 13.5, 190 13.5 L172 13.5 Z" fill="url(#solder-grad)" stroke="#94a3b8" stroke-width="0.6" />
        <line x1="174" y1="8.5" x2="196" y2="8.5" stroke="#ffffff" stroke-width="1" />
      </g>

      <!-- 25. C556SZe: Crimp & Seal + Twist & Solder (ย้ำ 1 ด้าน ใส่ซีล + ปั่นเกลียวจุ่มตะกั่ว 1 ด้าน) -->
      <g v-else-if="sampleType === 'crimp_single_seal_twist_tin' || sampleType === 'c556sze'">
        <!-- Left Brass Terminal -->
        <polygon points="0,5 14,5 18,7.5 18,12.5 14,15 0,15 4,10" fill="url(#brass-grad)" stroke="#a16207" stroke-width="0.6" />
        <circle cx="8" cy="10" r="2.2" fill="#713f12" />
        <!-- Left Weather Seal -->
        <rect x="18" y="3" width="16" height="14" rx="3" fill="url(#seal-yellow-grad)" stroke="#a16207" stroke-width="0.6" />
        <!-- Red Wire Body -->
        <rect x="34" y="5.5" width="136" height="9" rx="1.5" fill="url(#red-jacket-grad)" />
        <line x1="34" y1="7.5" x2="170" y2="7.5" stroke="#fca5a5" stroke-width="0.8" opacity="0.8" />
        <!-- Right Twisted & Soldered Tip -->
        <path d="M170 6.5 L188 6.5 Q200 6.5, 200 10 Q200 13.5, 188 13.5 L170 13.5 Z" fill="url(#solder-grad)" stroke="#94a3b8" stroke-width="0.6" />
        <path d="M172 8 Q180 6.5, 188 8 T198 8" stroke="#cbd5e1" stroke-width="1.2" fill="none" />
        <line x1="172" y1="10" x2="198" y2="10" stroke="#ffffff" stroke-width="1" />
      </g>

      <!-- 26. Solder Dipped Both Ends (ปั่นเกลียวจุ่มตะกั่ว 2 ด้าน) -->
      <g v-else-if="sampleType === 'tin_solder_both' || sampleType === 'solder'">
        <path d="M28 6.5 L10 6.5 Q0 6.5, 0 10 Q0 13.5, 10 13.5 L28 13.5 Z" fill="url(#solder-grad)" stroke="#94a3b8" stroke-width="0.6" />
        <line x1="4" y1="8.5" x2="26" y2="8.5" stroke="#ffffff" stroke-width="1" />
        <rect x="28" y="5.5" width="144" height="9" rx="1.5" fill="url(#red-jacket-grad)" />
        <line x1="28" y1="7.5" x2="172" y2="7.5" stroke="#fca5a5" stroke-width="0.8" opacity="0.8" />
        <path d="M172 6.5 L190 6.5 Q200 6.5, 200 10 Q200 13.5, 190 13.5 L172 13.5 Z" fill="url(#solder-grad)" stroke="#94a3b8" stroke-width="0.6" />
        <line x1="174" y1="8.5" x2="196" y2="8.5" stroke="#ffffff" stroke-width="1" />
      </g>

      <!-- Generic Fallback Wire -->
      <g v-else>
        <rect x="0" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
        <rect x="22" y="4" width="156" height="12" rx="1.5" fill="url(#grey-jacket-grad)" />
        <rect x="178" y="6.5" width="22" height="7" rx="0.5" fill="url(#copper-grad)" />
      </g>
    </svg>
  </div>
</template>
