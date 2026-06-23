<script setup>
import { ref, watch } from 'vue'
import { apiFetch } from '../utils/apiFetch'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  product: {
    type: Object,
    required: true // { id, name, image_url }
  }
})

const emit = defineEmits(['close', 'review-submitted'])
const { showToast } = useToast()
const { showConfirm } = useConfirm()

const submitting = ref(false)
const uploadingImage = ref(false)

const form = ref({
  rating: 5,
  comment: '',
  images: []
})
const hoverRating = ref(0)
const imageInput = ref(null)

const resetForm = () => {
  form.value = { rating: 5, comment: '', images: [] }
  hoverRating.value = 0
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm()
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const closeModal = () => {
  emit('close')
}

const handleImageUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  
  if (form.value.images.length + files.length > 3) {
    showToast('อัปโหลดรูปภาพได้สูงสุด 3 รูปเท่านั้น', 'error')
    return
  }

  uploadingImage.value = true
  try {
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.size > 5 * 1024 * 1024) {
            showToast(`รูปภาพ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 5MB)`, 'error')
            continue
        }
        
        const formData = new FormData()
        formData.append('image', file)
        
        const token = localStorage.getItem('token')
        const headers = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch('/api/upload', {
            method: 'POST',
            headers,
            body: formData
        })
        const data = await res.json()
        if (data.success) {
            form.value.images.push(data.url)
        } else {
            showToast(data.error || 'อัปโหลดรูปไม่สำเร็จ', 'error')
        }
    }
  } catch (err) {
    console.error('Upload Error:', err)
    showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ', 'error')
  } finally {
    uploadingImage.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}

const removeImage = (index) => {
  form.value.images.splice(index, 1)
}

const submitReview = async () => {
  if (!props.product?.id || !props.product?.order_id) return
  
  const isConfirmed = await showConfirm(
      'คุณไม่สามารถแก้ไขหรือลบรีวิวได้หลังจากบันทึกแล้ว ยืนยันที่จะส่งรีวิวหรือไม่?',
      'ยืนยันการบันทึกรีวิว',
      'warning'
  );
  if (!isConfirmed) return;

  submitting.value = true
  try {
    const res = await apiFetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        product_id: props.product.id,
        order_id: props.product.order_id,
        rating: form.value.rating,
        comment: form.value.comment,
        images: form.value.images
      })
    })
    const data = await res.json()
    if (data.success) {
      showToast(data.message, 'success')
      emit('review-submitted', Object.assign({ order_id: props.product.order_id }, form.value))
      closeModal()
    } else {
      showToast(data.error || 'ไม่สามารถส่งรีวิวได้', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาดเน็ตเวิร์ก', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 sm:mt-0 mt-16 mt-safe">
    <div class="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" @click="closeModal"></div>
    
    <div class="bg-white dark:bg-[#111827] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10 transform transition-all flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
        <h3 class="text-xl font-black text-gray-900 dark:text-white">รีวิวสินค้า</h3>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto w-full style-scrollbar flex-1 relative min-h-[300px]">

        <!-- Product Summary -->
        <div class="flex items-center gap-4 mb-6 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl">
          <div class="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-700 overflow-hidden shrink-0">
             <img v-if="product.image_url" :src="product.image_url" alt="Product" class="w-full h-full object-cover" />
             <svg v-else class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <div class="min-w-0">
             <h4 class="font-bold text-gray-900 dark:text-white truncate">{{ product.name }}</h4>
             <p class="text-xs text-gray-500">แบ่งปันความคิดเห็นของคุณกับสินค้านี้</p>
          </div>
        </div>

        <form @submit.prevent="submitReview">
          <!-- Star Selector -->
          <div class="flex flex-col items-center gap-2 mb-6">
            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">ให้คะแนนความพึงพอใจ:</span>
            <div class="flex gap-2">
                <button v-for="s in 5" :key="s" type="button" @click="form.rating = s" @mouseenter="hoverRating = s" @mouseleave="hoverRating = 0" class="focus:outline-none transition-transform hover:scale-125">
                <svg class="w-10 h-10" :class="s <= (hoverRating || form.rating) ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </button>
            </div>
          </div>

          <!-- Comment -->
          <div class="mb-4">
            <textarea v-model="form.comment" rows="4" class="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 focus:bg-white dark:bg-gray-800/80 dark:focus:bg-[#111827] text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none text-sm transition-colors" placeholder="บอกเราว่าคุณคิดอย่างไรกับสินค้านี้..."></textarea>
          </div>
          
          <!-- Image Upload Previews -->
          <div v-if="form.images.length > 0" class="flex flex-wrap gap-3 mb-4">
            <div v-for="(img, idx) in form.images" :key="idx" class="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
              <img :src="img" class="w-full h-full object-cover">
              <button type="button" @click="removeImage(idx)" class="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>

          <div class="mb-6">
            <input type="file" multiple accept="image/*" class="hidden" ref="imageInput" @change="handleImageUpload">
            <button type="button" @click="$refs.imageInput.click()" :disabled="form.images.length >= 3 || uploadingImage" class="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:border-emerald-500 dark:hover:text-emerald-400 dark:hover:border-emerald-500 bg-gray-50/50 hover:bg-emerald-50/50 dark:bg-gray-800/30 dark:hover:bg-emerald-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <svg v-if="!uploadingImage" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ uploadingImage ? 'กำลังอัปโหลด...' : 'แนบรูปภาพรีวิว (สูงสุด 3 รูป)' }}
            </button>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 mt-4 shrink-0">
            <button type="button" @click="closeModal" class="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors">
              ยกเลิก
            </button>
            <button type="submit" :disabled="submitting || uploadingImage" class="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
              <svg v-if="submitting" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ยืนยันการรีวิว
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
