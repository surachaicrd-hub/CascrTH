<template>
  <div class="px-4 py-8 max-w-[1600px] mx-auto min-h-screen pb-24">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
          </div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight">จัดการรีวิวสินค้า</h1>
        </div>
        <p class="text-slate-500 font-medium ml-13 flex items-center gap-1">ตรวจสอบ อนุมัติ และจัดการรีวิวจากลูกค้าทั้งหมด
          <InfoTooltip title="ระบบรีวิวคืออะไร?" description="รีวิวจากลูกค้าจะถูกส่งเข้ามาอัตโนมัติหลังจากลูกค้าชำระเงิน<ul><li><strong>สถานะรอตรวจสอบ:</strong> รีวิวใหม่จะรออนุมัติก่อนแสดงบนหน้าเว็บ</li><li><strong>กด แสดงผล/ซ่อน:</strong> สลับเปิด-ปิดการแสดงรีวิวได้ทันที</li><li><strong>คะแนนเฉลี่ย:</strong> คำนวณจากรีวิวที่แสดงผลแล้วเท่านั้น</li><li><strong>คลิกชื่อสินค้า:</strong> กรองเฉพาะสินค้านั้นๆ</li></ul>" />
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
          <button @click="statusFilter = 'all'" class="px-4 py-2 text-sm font-bold rounded-lg transition-colors" :class="statusFilter === 'all' ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:text-slate-700'">ทั้งหมด</button>
          <button @click="statusFilter = 'pending'" class="px-4 py-2 text-sm font-bold rounded-lg transition-colors" :class="statusFilter === 'pending' ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:text-slate-700'">
            รอตรวจสอบ
            <span v-if="pendingCount > 0" class="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md text-xs">{{ pendingCount }}</span>
          </button>
          <button @click="statusFilter = 'approved'" class="px-4 py-2 text-sm font-bold rounded-lg transition-colors" :class="statusFilter === 'approved' ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:text-slate-700'">แสดงผล</button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="text-slate-500 text-sm font-bold mb-1">รีวิวทั้งหมด</div>
        <div class="text-2xl font-black text-slate-800">{{ stats.total }}</div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="text-slate-500 text-sm font-bold mb-1">คะแนนเฉลี่ย</div>
        <div class="text-2xl font-black text-slate-800 flex items-center gap-2">
          {{ stats.average.toFixed(1) }}
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-rose-50 to-transparent"></div>
        <div class="relative">
          <div class="text-rose-600 text-sm font-bold mb-1">รอการตรวจสอบ</div>
          <div class="text-2xl font-black text-rose-700">{{ stats.pending }}</div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent"></div>
        <div class="relative">
          <div class="text-emerald-600 text-sm font-bold mb-1">แสดงผลแล้ว</div>
          <div class="text-2xl font-black text-emerald-700">{{ stats.approved }}</div>
        </div>
      </div>
    </div>

    <!-- Active Filters Display -->
    <div v-if="productFilter" class="mb-4 flex items-center gap-2">
      <span class="text-sm text-slate-500">กรองตามสินค้า:</span>
      <div class="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold flex items-center gap-2 border border-indigo-100">
        {{ productFilterName }}
        <button @click="clearProductFilter" class="hover:text-indigo-900"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center">
        <svg class="animate-spin w-8 h-8 text-amber-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p class="text-slate-500 font-medium">กำลังโหลดข้อมูลรีวิว...</p>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="filteredReviews.length === 0" class="p-16 text-center">
        <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <svg class="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        </div>
        <h3 class="text-lg font-black text-slate-800 mb-1">ไม่พบข้อมูลรีวิว</h3>
        <p class="text-slate-500">ไม่มีรายการรีวิวในหมวดหมู่นี้</p>
      </div>
      
      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50/50">
              <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">สินค้า</th>
              <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/5">คะแนน & รีวิว</th>
              <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">ผู้รีวิว</th>
              <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">วันที่</th>
              <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-32">สถานะ / จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="review in filteredReviews" :key="review.id" class="hover:bg-slate-50/50 transition-colors" :class="{'bg-rose-50/30': review.is_approved === 0}">
              <!-- Product -->
              <td class="p-4 align-top">
                <div class="flex items-start gap-3 cursor-pointer group" @click="setProductFilter(review.product_id, review.product_name)">
                  <img v-if="review.product_image" :src="review.product_image" class="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white" alt="Product">
                  <div class="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400" v-else>
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">{{ review.product_name }}</h3>
                    <span class="text-xs text-slate-400 font-mono mt-1 block blur-[2px] hover:blur-none transition-all">{{ review.id.substring(0,8) }}</span>
                  </div>
                </div>
              </td>
              
              <!-- Review Content -->
              <td class="p-4 align-top">
                <div class="flex gap-0.5 mb-2">
                  <svg v-for="s in 5" :key="s" class="w-4 h-4" :class="s <= review.rating ? 'text-amber-400' : 'text-slate-200'" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                <!-- Comment -->
                <p v-if="review.comment" class="text-sm text-slate-600 mb-3 leading-relaxed whitespace-pre-line break-words">
                  {{ review.comment }}
                </p>
                <p v-else class="text-sm text-slate-400 italic mb-3">ไม่ได้เขียนข้อความรีวิว</p>
                
                <!-- Images -->
                <div v-if="reviewImages(review).length > 0" class="flex flex-wrap gap-2">
                  <div v-for="(img, idx) in reviewImages(review)" :key="idx" @click="openImage(img)" class="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in hover:border-amber-400 hover:shadow-sm transition-all">
                    <img :src="img" class="w-full h-full object-cover">
                  </div>
                </div>
              </td>
              
              <!-- Reviewer -->
              <td class="p-4 align-top">
                <div class="text-sm font-bold text-slate-800">{{ getReviewerName(review) }}</div>
                <div class="text-xs text-slate-500 mb-1">{{ review.email }}</div>
              </td>
              
              <!-- Date -->
              <td class="p-4 align-top">
                <div class="text-sm text-slate-600">{{ formatDate(review.created_at) }}</div>
                <div class="text-xs text-slate-400 mt-1">{{ timeAgo(review.created_at) }}</div>
              </td>
              
              <!-- Actions -->
              <td class="p-4 align-top text-right">
                <div class="flex flex-col items-end gap-2">
                  <!-- Status Toggle -->
                  <button 
                    @click="toggleStatus(review)"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all w-28 justify-center"
                    :class="review.is_approved === 1 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' 
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'"
                  >
                    <span v-if="review.is_approved === 1" class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span v-else class="w-2 h-2 rounded-full bg-rose-500"></span>
                    {{ review.is_approved === 1 ? 'แสดงผล' : 'ซ่อน/รอตรวจ' }}
                  </button>
                  
                  <!-- Options Dropdown -->
                  <div class="relative group">
                    <button class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                    </button>
                    <!-- Menu -->
                    <div class="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                      <button @click="deleteReview(review.id)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        ลบรีวิว
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Image Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="modalImage" class="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8" @click.self="modalImage = null">
          <button @click="modalImage = null" class="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img :src="modalImage" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-none">
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiFetch } from '../../utils/apiFetch'
import { useToast } from '../../composables/useToast'
import Swal from 'sweetalert2'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()
const reviews = ref([])
const loading = ref(true)

const statusFilter = ref('all') // 'all', 'pending', 'approved'
const productFilter = ref(null)
const productFilterName = ref('')
const modalImage = ref(null)

const stats = computed(() => {
  const total = reviews.value.length;
  const approved = reviews.value.filter(r => r.is_approved === 1).length;
  const pending = reviews.value.filter(r => r.is_approved === 0).length;
  const avg = total > 0 ? reviews.value.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  
  return { total, approved, pending, average: avg };
});

const pendingCount = computed(() => stats.value.pending)

const filteredReviews = computed(() => {
  let result = reviews.value;
  
  if (statusFilter.value === 'pending') {
    result = result.filter(r => r.is_approved === 0);
  } else if (statusFilter.value === 'approved') {
    result = result.filter(r => r.is_approved === 1);
  }
  
  if (productFilter.value) {
    result = result.filter(r => r.product_id === productFilter.value);
  }
  
  return result;
});

const loadReviews = async () => {
    loading.value = true;
    try {
        const res = await apiFetch('/api/reviews/admin/all');
        const data = await res.json();
        if (data.success) {
            reviews.value = data.data;
        } else {
            showToast(data.error || 'ไม่สามารถโหลดข้อมูลรีวิวได้', 'error');
        }
    } catch (error) {
        showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    } finally {
        loading.value = false;
    }
}

const toggleStatus = async (review) => {
    const newStatus = review.is_approved === 1 ? 0 : 1;
    const actionName = newStatus === 1 ? 'อนุมัติการแสดงผล' : 'ซ่อนรีวิว';
    
    try {
        const res = await apiFetch(`/api/reviews/admin/${review.id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ is_approved: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            review.is_approved = newStatus;
            showToast(`${actionName}สำเร็จ`, 'success');
        } else {
            showToast(data.error || 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
        }
    } catch (error) {
        showToast('เกิดข้อผิดพลาดเน็ตเวิร์ก', 'error');
    }
}

const deleteReview = async (id) => {
    const result = await Swal.fire({
        title: 'ยืนยันการลบรีวิว',
        text: 'การกระทำนี้ไม่สามารถกู้คืนได้ คะแนนรวมของสินค้าจะถูกคำนวณใหม่',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'ลบทิ้ง',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true
    });

    if (result.isConfirmed) {
        try {
            const res = await apiFetch(`/api/reviews/admin/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                reviews.value = reviews.value.filter(r => r.id !== id);
                showToast('ลบรีวิวเรียบร้อยแล้ว', 'success');
            } else {
                showToast(data.error || 'ไม่สามารถลบรีวิวได้', 'error');
            }
        } catch (error) {
            showToast('เกิดข้อผิดพลาดเน็ตเวิร์ก', 'error');
        }
    }
}

// Helpers
const reviewImages = (review) => {
    if (!review.images) return [];
    try {
        return typeof review.images === 'string' ? JSON.parse(review.images) : review.images;
    } catch (e) {
        return [];
    }
}

const getReviewerName = (r) => {
  if (r.first_name || r.last_name) {
    return `${r.first_name || ''} ${r.last_name || ''}`.trim()
  }
  return 'ลูกค้า'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('th-TH', {
    dateStyle: 'medium'
  })
}

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชม. ที่แล้ว`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} วันที่แล้ว`
  return ''
}

const setProductFilter = (id, name) => {
    productFilter.value = id;
    productFilterName.value = name;
}

const clearProductFilter = () => {
    productFilter.value = null;
    productFilterName.value = '';
}

const openImage = (url) => {
    modalImage.value = url;
}

onMounted(() => {
    loadReviews()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
