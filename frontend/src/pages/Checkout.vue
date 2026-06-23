<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'
import { apiFetch } from '../utils/apiFetch'
import { isValidThaiPhone, isValidTaxId } from '../composables/useValidation'

const openLoginModal = inject('openLoginModal', () => {})

// Native debounce — no lodash dependency needed
const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
const authStore = useAuthStore()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const router = useRouter()
const { showToast } = useToast()

const submitting = ref(false)
const isCalculatingShipping = ref(false)
const shippingCost = ref(0)

// Coupon State
const couponCodeInput = ref('')
const appliedCoupon = ref(null)   // { code, type, value, discount_amount, message }
const couponError = ref('')
const isValidatingCoupon = ref(false)

// Guest Email
const guestEmail = ref('')

// Form State
const shipping = ref({
  first_name: '',
  last_name: '',
  phone: '',
  address_line: '',
  subdistrict: '',
  district: '',
  province: '',
  postal_code: ''
})

const requireTaxInvoice = ref(false)
const taxInvoice = ref({
  company_name: '',
  tax_id: '',
  branch: 'สำนักงานใหญ่',
  address_line: '',
  subdistrict: '',
  district: '',
  province: '',
  postal_code: ''
})

// Address Auto-Save State
const savedAddresses = ref([])
const useNewShippingAddress = ref(false)
const useNewTaxAddress = ref(false)
const saveShippingAddress = ref(true)
const saveTaxAddress = ref(true)

// Coupon Discount
const couponDiscount = computed(() => appliedCoupon.value ? appliedCoupon.value.discount_amount : 0)

// Validation
const isShippingValid = computed(() => {
  const s = shipping.value
  if (!s.first_name || !s.last_name || !s.phone || !s.address_line || !s.subdistrict || !s.district || !s.province || !s.postal_code) return false
  if (!isValidThaiPhone(s.phone)) return false
  return true
})

const isPaymentValid = computed(() => {
  return selectedPayment.value !== ''
})

// Calculate Shipping using debounce to prevent spamming APi when typing
const fetchShippingQuote = debounce(async () => {
    isRestricted.value = false;
    restrictedMessage.value = '';

    if (!shipping.value.province || cartStore.items.length === 0) {
        shippingCost.value = 0;
        return;
    }

    isCalculatingShipping.value = true;
    try {
        const payload = {
            items: cartStore.items.map(i => ({ 
                product_id: i.product_id || i.id, 
                quantity: i.quantity 
            })),
            address: {
                province: shipping.value.province,
                district: shipping.value.district || shipping.value.subdistrict
            }
        };

        const res = await apiFetch('/api/shipping/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success && data.data) {
            if (data.data.is_restricted) {
                isRestricted.value = true;
                restrictedMessage.value = data.data.message;
                shippingCost.value = 0;
            } else {
                shippingCost.value = data.data.cost;
            }
        } else {
            shippingCost.value = 0;
            console.error('Shipping calculation failed', data.error);
        }
    } catch (e) {
        console.error('Error fetching shipping quote', e);
        shippingCost.value = 0;
    } finally {
        isCalculatingShipping.value = false;
    }
}, 500);

// Watch for changes in province or district to recalculate shipping
watch(() => [shipping.value.province, shipping.value.district], () => {
    fetchShippingQuote();
});

// Payment Methods
const availablePayments = computed(() => {
  const methods = []
  if (settingsStore.paymentBankTransferEnabled) {
    methods.push({ id: 'bank_transfer', name: 'โอนเงินบัญชีธนาคาร', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />` })
  }
  if (settingsStore.paymentPromptpayEnabled) {
    methods.push({ id: 'promptpay', name: 'พร้อมเพย์ (PromptPay)', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />` })
  }

  // iPay Payment Gateway
  if (settingsStore.paymentIpayEnabled) {
    methods.push({ id: 'ipay', name: 'บัตรเครดิต/เดบิต (Bualuang iPay)', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />` })
  }
  return methods
})

const selectedPayment = ref('')
const isRestricted = ref(false)
const restrictedMessage = ref('')

// Copy Shipping Address helper
const copyShippingAddress = () => {
    taxInvoice.value.address_line = shipping.value.address_line;
    taxInvoice.value.subdistrict = shipping.value.subdistrict;
    taxInvoice.value.district = shipping.value.district;
    taxInvoice.value.province = shipping.value.province;
    taxInvoice.value.postal_code = shipping.value.postal_code;
    showToast('คัดลอกที่อยู่จัดส่งเรียบร้อยแล้ว', 'success');
}

// Reusable function to load user addresses + profile
const loadUserData = async () => {
    if (!authStore.isAuthenticated) return
    try {
        // 1. Fetch Saved Addresses
        const addressRes = await apiFetch('/api/users/addresses', {
            headers: { 'Authorization': `Bearer ${authStore.token}` }
        })
        const addressData = await addressRes.json()
        if (addressData.success && addressData.data) {
            savedAddresses.value = addressData.data
        }

        // Quick load profile to prefill form
        const res = await apiFetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${authStore.token}` }
        })
        const data = await res.json()

        // 2. Pre-fill Shipping Logic
        const shippingList = savedAddresses.value.filter(a => a.type === 'shipping')
        if (shippingList.length > 0) {
            // Pre-fill with first/default saved address
            const defaultShip = shippingList.find(a => a.is_default) || shippingList[0]
            Object.assign(shipping.value, defaultShip)
            useNewShippingAddress.value = false
        } else if (data.success && data.data) {
            // Fallback to Base Profile
            shipping.value.first_name = data.data.first_name || ''
            shipping.value.last_name = data.data.last_name || ''
            shipping.value.phone = data.data.phone || ''
            shipping.value.address_line = data.data.address_line || ''
            shipping.value.subdistrict = data.data.subdistrict || ''
            shipping.value.district = data.data.district || ''
            shipping.value.province = data.data.province || ''
            shipping.value.postal_code = data.data.postal_code || ''
            useNewShippingAddress.value = true
        } else {
            useNewShippingAddress.value = true
        }

        // 3. Pre-fill Tax Logic
        const taxList = savedAddresses.value.filter(a => a.type === 'tax')
        if (taxList.length > 0) {
            useNewTaxAddress.value = false
            const defaultTax = taxList.find(a => a.is_default) || taxList[0]
            Object.assign(taxInvoice.value, defaultTax)
        } else {
            useNewTaxAddress.value = true
        }

        // Sync cart from server after login
        await cartStore.fetchCart()
    } catch (e) {
        console.error('Failed to prefill user details', e)
    }
}

// Watch for login state changes (e.g. user logs in via modal)
watch(() => authStore.isAuthenticated, (isAuth) => {
    if (isAuth) {
        loadUserData()
    }
})

// Pre-fill user data if logged in
onMounted(async () => {
    if (!settingsStore.isOnlineShoppingEnabled) {
        router.replace('/')
        return
    }

    if (cartStore.items.length === 0) {
        setTimeout(() => {
            if (cartStore.items.length === 0) {
                router.replace('/cart')
            }
        }, 500)
    }

    // Auto-select first available payment
    if (availablePayments.value.length > 0) {
        selectedPayment.value = availablePayments.value[0].id
    }

    if (authStore.isAuthenticated) {
        await loadUserData()
    } else {
        fetchShippingQuote();
    }
})

const validateCoupon = async () => {
    const code = couponCodeInput.value.trim().toUpperCase()
    if (!code) return
    couponError.value = ''
    isValidatingCoupon.value = true
    try {
        const subtotal = cartStore.subtotal + shippingCost.value
        const res = await apiFetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, order_amount: subtotal })
        })
        const data = await res.json()
        if (data.success) {
            appliedCoupon.value = { ...data.coupon, discount_amount: data.discount_amount, message: data.message }
            showToast(data.message, 'success')
        } else {
            couponError.value = data.error || 'โค้ดไม่ถูกต้อง'
            appliedCoupon.value = null
        }
    } catch (e) {
        couponError.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    } finally {
        isValidatingCoupon.value = false
    }
}

const removeCoupon = () => {
    appliedCoupon.value = null
    couponCodeInput.value = ''
    couponError.value = ''
}

const handleCheckout = async () => {
    if (!isShippingValid.value) {
        // Determine specific reason
        const s = shipping.value
        if (s.phone && !isValidThaiPhone(s.phone)) {
            showToast('เบอร์โทรศัพท์ไม่ถูกต้อง ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก', 'error')
        } else {
            showToast('กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน', 'error')
        }
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
    }
    if (!isPaymentValid.value) {
        showToast('กรุณาเลือกช่องทางการชำระเงิน', 'error')
        return
    }

    if (requireTaxInvoice.value && taxInvoice.value.tax_id && !isValidTaxId(taxInvoice.value.tax_id)) {
        showToast('เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก', 'error')
        return
    }

    submitting.value = true

    try {
        const payload = {
            items: cartStore.items.map(item => ({
                product_id: item.product_id || item.id,
                quantity: item.quantity
            })),
            shippingAddress: shipping.value,
            taxInvoice: requireTaxInvoice.value ? taxInvoice.value : null,
            paymentMethod: selectedPayment.value,
            saveShippingAddress: useNewShippingAddress.value && saveShippingAddress.value,
            saveTaxAddress: requireTaxInvoice.value && useNewTaxAddress.value && saveTaxAddress.value,
            couponCode: appliedCoupon.value ? appliedCoupon.value.code : null,
            customerEmail: !authStore.isAuthenticated ? guestEmail.value : null
        }

        const headers = { 'Content-Type': 'application/json' }
        if (authStore.isAuthenticated) {
            headers['Authorization'] = `Bearer ${authStore.token}`
        }

        const res = await apiFetch('/api/orders', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        })

        const data = await res.json()
        if (data.success) {
            // Wipe cart locally as well
            cartStore.clearCart()

            if (selectedPayment.value === 'ipay') {
                try {
                    const ipayRes = await apiFetch('/api/payments/ipay/checkout', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ orderId: data.order_id })
                    })
                    const ipayData = await ipayRes.json()
                    
                    if (ipayData.success) {
                        submitting.value = true // keep loading state active
                        
                        // Create an invisible HTML form and auto-submit it
                        const form = document.createElement('form')
                        form.method = 'POST'
                        form.action = ipayData.payload.gatewayUrl
                        
                        for (const key in ipayData.payload.formData) {
                            const input = document.createElement('input')
                            input.type = 'hidden'
                            input.name = key
                            input.value = ipayData.payload.formData[key]
                            form.appendChild(input)
                        }
                        
                        document.body.appendChild(form)
                        form.submit()
                        return // stop here because the browser is navigating to iPay
                    } else {
                        showToast(ipayData.error || 'เริ่มขั้นตอนชำระเงินไม่สำเร็จ', 'error')
                        router.push(`/order-success/${data.order_id}`)
                    }
                } catch (e) {
                    console.error('iPay redirect error:', e)
                    showToast('เชื่อมต่อระบบชำระเงินไม่สำเร็จ', 'error')
                    router.push(`/order-success/${data.order_id}`)
                }
            } else {
                router.push(`/order-success/${data.order_id}`)
            }
        } else {
            showToast(data.error || 'เกิดข้อผิดพลาดในการสั่งซื้อ', 'error')
        }
    } catch (err) {
        console.error('Checkout error:', err)
        showToast('เซิร์ฟเวอร์ขัดข้อง ไม่สามารถทำรายการสั่งซื้อได้', 'error')
    } finally {
        submitting.value = false
    }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-28 min-h-screen">
    
    <div class="flex items-center gap-3 mb-8">
      <router-link to="/cart" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      </router-link>
      <h1 class="text-3xl font-black text-gray-900 dark:text-white my-auto uppercase tracking-wide">
        ชำระเงิน (Checkout)
      </h1>
    </div>

    <!-- Empty Cart Escaper (In case they reload manually on an empty cart) -->
    <div v-if="cartStore.items.length === 0" class="text-center py-20">
        <div class="w-16 h-16 mx-auto border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-500">กำลังตรวจสอบข้อมูลสินค้าตะกร้า...</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
      
      <!-- Left Column: Forms -->
      <div class="lg:col-span-8 flex flex-col gap-6">

        <!-- 1. Shipping Address -->
        <div class="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">1</div>
                ที่อยู่สำหรับจัดส่ง
            </h2>

            <!-- Guest notice if not logged in -->
            <div v-if="!authStore.isAuthenticated" class="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-start gap-4">
                <svg class="w-6 h-6 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div class="text-sm">
                    <p class="font-bold text-gray-900 dark:text-white">สั่งซื้อในฐานะผู้เยี่ยมชม</p>
                    <p class="text-gray-500 dark:text-gray-400">คุณสามารถ <button @click="openLoginModal()" class="text-emerald-600 hover:underline font-bold">เข้าสู่ระบบ</button> เพื่อดึงข้อมูลที่อยู่ของคุณได้โดยอัตโนมัติ</p>
                </div>
            </div>

            <!-- Saved Shipping Addresses Selection -->
            <div v-if="authStore.isAuthenticated && savedAddresses.filter(a => a.type === 'shipping').length > 0" class="mb-6">
                <label class="block text-sm font-bold text-gray-900 dark:text-white mb-3">เลือกที่อยู่จัดส่ง</label>
                <div class="space-y-3">
                    <label v-for="addr in savedAddresses.filter(a => a.type === 'shipping')" :key="addr.id" class="flex items-start gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" :class="!useNewShippingAddress && shipping.address_line === addr.address_line ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-gray-700'">
                        <input type="radio" name="shippingAddressSelect" :value="false" :checked="!useNewShippingAddress && shipping.address_line === addr.address_line" @change="() => { useNewShippingAddress = false; Object.assign(shipping, addr); }" class="mt-1 text-emerald-600 focus:ring-emerald-500 border-gray-300">
                        <div class="flex-grow">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-bold text-gray-900 dark:text-white">{{ addr.title }}</span>
                                <span v-if="addr.is_default" class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">ค่าเริ่มต้น</span>
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-400">{{ addr.first_name }} {{ addr.last_name }} ({{ addr.phone }})</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">{{ addr.address_line }} ต.{{ addr.subdistrict }} อ.{{ addr.district }} จ.{{ addr.province }} {{ addr.postal_code }}</p>
                        </div>
                    </label>

                    <label class="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" :class="useNewShippingAddress ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-gray-700'">
                         <input type="radio" name="shippingAddressSelect" :value="true" v-model="useNewShippingAddress" @change="() => { shipping = { first_name: '', last_name: '', phone: '', address_line: '', subdistrict: '', district: '', province: '', postal_code: '' }; }" class="text-emerald-600 focus:ring-emerald-500 border-gray-300">
                         <span class="font-bold text-gray-900 dark:text-white">เพิ่มที่อยู่จัดส่งใหม่</span>
                    </label>
                </div>
            </div>

            <!-- New Shipping Address Form -->
            <div v-show="useNewShippingAddress || !authStore.isAuthenticated || savedAddresses.filter(a => a.type === 'shipping').length === 0">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ชื่อผู้รับ <span class="text-red-500">*</span></label>
                        <input v-model="shipping.first_name" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors" placeholder="ชื่อ">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">นามสกุล <span class="text-red-500">*</span></label>
                        <input v-model="shipping.last_name" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors" placeholder="นามสกุล">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">เบอร์โทรศัพท์ <span class="text-red-500">*</span></label>
                        <input v-model="shipping.phone" type="tel" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors" :class="shipping.phone && !isValidThaiPhone(shipping.phone) ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'" placeholder="08xxxxxxxx">
                        <p v-if="shipping.phone && !isValidThaiPhone(shipping.phone)" class="text-xs text-red-500 mt-1 font-medium">เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก</p>
                    </div>
                    <div class="md:col-span-2 mt-2">
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ที่อยู่ (บ้านเลขที่ หมู่บ้าน ซอย ถนน) <span class="text-red-500">*</span></label>
                        <input v-model="shipping.address_line" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors" placeholder="กรอกที่อยู่จัดส่ง">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">แขวง/ตำบล <span class="text-red-500">*</span></label>
                        <input v-model="shipping.subdistrict" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">เขต/อำเภอ <span class="text-red-500">*</span></label>
                        <input v-model="shipping.district" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">จังหวัด <span class="text-red-500">*</span></label>
                        <input v-model="shipping.province" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">รหัสไปรษณีย์ <span class="text-red-500">*</span></label>
                        <input v-model="shipping.postal_code" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors">
                    </div>
                </div>
                
                <!-- Prompt to Save for Next Time -->
                <div v-if="authStore.isAuthenticated" class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" v-model="saveShippingAddress" class="rounded text-emerald-600 focus:ring-emerald-500 bg-gray-100 border-gray-300">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">บันทึกที่อยู่นี้ไว้ในโปรไฟล์สำหรับใช้ครั้งต่อไป</span>
                    </label>
                </div>
            </div>
        </div>

        <!-- 2. Tax Invoice -->
        <div class="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">2</div>
                    ข้อมูลออกใบกำกับภาษี
                </h2>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="requireTaxInvoice" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
            </div>

            <div v-if="requireTaxInvoice" class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 animate-[fadeIn_0.3s_ease-out]">
                
                 <!-- Saved Tax Addresses Selection -->
                <div v-if="authStore.isAuthenticated && savedAddresses.filter(a => a.type === 'tax').length > 0" class="mb-6">
                    <label class="block text-sm font-bold text-gray-900 dark:text-white mb-3">เลือกที่อยู่ออกใบกำกับภาษี</label>
                    <div class="space-y-3">
                        <label v-for="addr in savedAddresses.filter(a => a.type === 'tax')" :key="addr.id" class="flex items-start gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" :class="!useNewTaxAddress && taxInvoice.address_line === addr.address_line ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-gray-700'">
                            <input type="radio" name="taxAddressSelect" :value="false" :checked="!useNewTaxAddress && taxInvoice.address_line === addr.address_line" @change="() => { useNewTaxAddress = false; Object.assign(taxInvoice, addr); }" class="mt-1 text-emerald-600 focus:ring-emerald-500 border-gray-300">
                            <div class="flex-grow">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="font-bold text-gray-900 dark:text-white">{{ addr.title }}</span>
                                    <span v-if="addr.is_default" class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">ค่าเริ่มต้น</span>
                                </div>
                                <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ addr.company_name }} <span class="text-xs text-gray-500 font-normal ml-2">เลขที่ผู้เสียภาษี: {{ addr.tax_id }} ({{ addr.branch }})</span></p>
                                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">{{ addr.address_line }} ต.{{ addr.subdistrict }} อ.{{ addr.district }} จ.{{ addr.province }} {{ addr.postal_code }}</p>
                            </div>
                        </label>

                        <label class="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" :class="useNewTaxAddress ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-gray-700'">
                            <input type="radio" name="taxAddressSelect" :value="true" v-model="useNewTaxAddress" @change="() => { taxInvoice = { company_name: '', tax_id: '', branch: 'สำนักงานใหญ่', address_line: '', subdistrict: '', district: '', province: '', postal_code: '' }; }" class="text-emerald-600 focus:ring-emerald-500 border-gray-300">
                            <span class="font-bold text-gray-900 dark:text-white">เพิ่มที่อยู่ออกใบกำกับภาษีใหม่</span>
                        </label>
                    </div>
                </div>

                <!-- New Tax Address Form -->
                <div v-show="useNewTaxAddress || !authStore.isAuthenticated || savedAddresses.filter(a => a.type === 'tax').length === 0">
                    <div class="mb-5 flex justify-end">
                        <button type="button" @click="copyShippingAddress" class="text-sm flex items-center gap-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                            </svg>
                            ใช้ข้อมูลเดียวกันกับที่อยู่จัดส่ง
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ชื่อบริษัท / นิติบุคคล <span class="text-red-500">*</span></label>
                        <input v-model="taxInvoice.company_name" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก) <span class="text-red-500">*</span></label>
                        <input v-model="taxInvoice.tax_id" type="text" maxlength="13" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors" :class="taxInvoice.tax_id && !isValidTaxId(taxInvoice.tax_id) ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'" placeholder="0105xxxxxxxxx">
                        <p v-if="taxInvoice.tax_id && !isValidTaxId(taxInvoice.tax_id)" class="text-xs text-red-500 mt-1 font-medium">เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก</p>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">สาขา <span class="text-red-500">*</span></label>
                        <input v-model="taxInvoice.branch" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors" placeholder="เช่น สำนักงานใหญ่, 00001">
                    </div>
                    <div class="md:col-span-2 mt-2">
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ที่อยู่จดทะเบียน <span class="text-red-500">*</span></label>
                        <input v-model="taxInvoice.address_line" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">แขวง/ตำบล <span class="text-red-500">*</span></label>
                        <input v-model="taxInvoice.subdistrict" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">เขต/อำเภอ <span class="text-red-500">*</span></label>
                        <input v-model="taxInvoice.district" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors">
                    </div>
                     <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">จังหวัด <span class="text-red-500">*</span></label>
                        <input v-model="taxInvoice.province" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">รหัสไปรษณีย์ <span class="text-red-500">*</span></label>
                        <input v-model="taxInvoice.postal_code" type="text" class="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors">
                    </div>
                </div>
            </div>

                <!-- Prompt to Save for Next Time -->
                <div v-if="authStore.isAuthenticated" class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" v-model="saveTaxAddress" class="rounded text-emerald-600 focus:ring-emerald-500 bg-gray-100 border-gray-300">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">บันทึกข้อมูลออกใบกำกับภาษีนี้ไว้ครั้งต่อไป</span>
                    </label>
                </div>
            </div>
        </div>

        <!-- 3. Payment Methods -->
        <div class="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">3</div>
                ช่องทางการชำระเงิน
            </h2>

            <!-- Restricted Area Notice -->
            <div v-if="isRestricted" class="text-red-600 bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl text-sm border border-red-200 dark:border-red-800/50 mb-4 shadow-sm relative overflow-hidden">
                <div class="absolute inset-0 bg-pattern opacity-5 pointer-events-none"></div>
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-2">
                        <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <h3 class="font-bold text-lg">ไม่สามารถจัดส่งได้</h3>
                    </div>
                    <p class="mb-3 text-red-700 dark:text-red-400">{{ restrictedMessage }}</p>
                    <p class="text-sm font-medium text-red-800 dark:text-red-300">กรุณาติดต่อเจ้าหน้าที่ฝ่ายขายเพื่อสอบถามข้อมูลเพิ่มเติมผ่านช่องทาง Line หรือโทรศัพท์</p>
                </div>
            </div>

            <div v-else-if="availablePayments.length === 0" class="text-red-500 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl text-sm border border-red-100 dark:border-red-800">
                <svg class="w-5 h-5 text-amber-500 shrink-0 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> ขออภัย ขณะนี้ระบบยังไม่เปิดรับชำระเงิน กรุณาติดต่อแอดมินหรือขอใบเสนอราคาแทน
            </div>

            <div v-else class="space-y-4">
                <label v-for="method in availablePayments" :key="method.id" 
                    class="relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200"
                    :class="selectedPayment === method.id ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'">
                    
                    <input type="radio" :value="method.id" v-model="selectedPayment" class="w-5 h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                    
                    <div class="flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300" v-html="`<svg class='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>${method.icon}</svg>`">
                    </div>
                    
                    <div class="flex-grow">
                        <p class="font-bold text-gray-900 dark:text-white">{{ method.name }}</p>
                    </div>
                </label>

                <!-- Dynamic Info for Bank Transfer -->
                <div v-if="selectedPayment === 'bank_transfer' && settingsStore.paymentBankAccounts.length > 0" class="mt-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
                    <p class="text-sm font-bold text-amber-800 dark:text-amber-500 mb-3">เมื่อสร้างคำสั่งซื้อสำเร็จ กรุณาโอนเงินเข้าบัญชีดังต่อไปนี้:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div v-for="(bank, idx) in settingsStore.paymentBankAccounts" :key="idx" class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <!-- Helper mapping to thai colors -->
                            <div class="w-10 h-10 rounded-full flex-shrink-0 font-bold flex items-center justify-center tracking-tighter" :style="{ backgroundColor: bank.bank === 'kbank' ? '#138f2d' : bank.bank === 'scb' ? '#4e2e7f' : bank.bank === 'bbl' ? '#1e4598' : bank.bank === 'ktb' ? '#00aeeF' : bank.bank === 'ttb' ? '#0050f0' : bank.bank === 'krungsri' ? '#fec43b' : '#333', color: bank.bank === 'krungsri' ? '#000' : '#fff' }">
                                {{ bank.bank ? bank.bank.toUpperCase() : 'BANK' }}
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">{{ bank.name }}</p>
                                <p class="font-black text-gray-900 dark:text-white text-base tracking-wider">{{ bank.number }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dynamic Info for Promptpay -->
                <div v-if="selectedPayment === 'promptpay' && settingsStore.paymentPromptpayNumber" class="mt-4 p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 flex items-center gap-5">
                    <div class="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                        <span class="text-white font-black text-xs whitespace-pre text-center leading-tight">Prompt<br/>Pay</span>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">โอนเข้าหมายเลขพร้อมเพย์</p>
                        <p class="font-black text-2xl text-gray-900 dark:text-white tracking-wider font-mono">{{ settingsStore.paymentPromptpayNumber }}</p>
                    </div>
                </div>

            </div>
        </div>
      </div>

      <!-- Right Column: Order Summary -->
      <div class="lg:col-span-4 sticky top-32">
        <div class="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wide">สรุปคำสั่งซื้อ</h2>

          <!-- Guest Email -->
          <div v-if="!authStore.isAuthenticated" class="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <label class="block text-xs font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              Email สำหรับรับยืนยัน Order (สำหรับผู้เยี่ยมชม)
            </label>
            <input
              v-model="guestEmail"
              type="email"
              placeholder="your@email.com"
              class="w-full border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-800 dark:text-white transition-colors"
            >
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-1.5">หากไม่กรอก จะไม่ได้รับ Email ยืนยัน</p>
          </div>

          <!-- Coupon Code -->
          <div class="mb-5">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
              โค้ดส่วนลด
            </label>
            <div v-if="!appliedCoupon" class="flex gap-2">
              <input
                v-model="couponCodeInput"
                @keyup.enter="validateCoupon"
                type="text"
                placeholder="กรอกโค้ดส่วนลด"
                class="flex-1 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-white transition-colors"
                :class="{ 'border-red-400': couponError }"
              >
              <button
                @click="validateCoupon"
                :disabled="isValidatingCoupon || !couponCodeInput.trim()"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex-shrink-0"
              >
                <svg v-if="isValidatingCoupon" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span v-else>ใช้งาน</span>
              </button>
            </div>
            <p v-if="couponError" class="text-xs text-red-500 mt-1.5 font-medium">{{ couponError }}</p>

            <!-- Applied Coupon Badge -->
            <div v-if="appliedCoupon" class="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div>
                <p class="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                  {{ appliedCoupon.code }}
                </p>
                <p class="text-xs text-emerald-600 dark:text-emerald-500">ส่วนลด ฿{{ appliedCoupon.discount_amount.toLocaleString() }}</p>
              </div>
              <button @click="removeCoupon" class="text-gray-400 hover:text-red-500 transition-colors p-1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="space-y-4 text-sm mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div class="flex justify-between items-center text-gray-600 dark:text-gray-400">
              <span>ยอดรวมสินค้า ({{ cartStore.cartTotal }} ชิ้น)</span>
              <span class="font-medium text-gray-900 dark:text-white">฿{{ (cartStore.subtotal + cartStore.discountTotal).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center text-gray-600 dark:text-gray-400">
              <span>ส่วนลด</span>
              <span class="font-medium text-emerald-600 dark:text-emerald-400">{{ cartStore.discountTotal > 0 ? `- ฿${cartStore.discountTotal.toLocaleString()}` : '- ฿0' }}</span>
            </div>
            <!-- Coupon Discount Row -->
            <div v-if="couponDiscount > 0" class="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                โค้ดส่วนลด
              </span>
              <span class="font-bold">- ฿{{ couponDiscount.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center text-gray-600 dark:text-gray-400">
              <span>ค่าจัดส่ง</span>
              <div class="flex items-center gap-2">
                <svg v-if="isCalculatingShipping" class="w-4 h-4 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span class="font-medium text-gray-900 dark:text-white" :class="{'opacity-50': isCalculatingShipping}">
                    {{ shippingCost > 0 ? `฿${shippingCost.toLocaleString()}` : (shipping.province ? 'ฟรี' : 'กรุณาระบุที่อยู่') }}
                </span>
              </div>
            </div>
          </div>

          <div class="mb-8">
            <div class="flex justify-between items-end">
              <span class="text-base font-bold text-gray-900 dark:text-white">ยอดสุทธิ</span>
              <div class="text-right">
                <span class="text-3xl font-black text-emerald-600 dark:text-emerald-500">
                    ฿{{ (cartStore.subtotal + shippingCost - couponDiscount).toLocaleString() }}
                </span>
              </div>
            </div>
          </div>

          <button 
            @click="handleCheckout" 
            :disabled="submitting || isRestricted || availablePayments.length === 0"
            class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
            <template v-if="submitting">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                กำลังดำเนินการ...
            </template>
            <template v-else>
                ยืนยันคำสั่งซื้อ
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </template>
          </button>

          <p class="text-xs text-gray-400 text-center mt-4">การคลิก "ยืนยันคำสั่งซื้อ" หมายความว่าคุณยอมรับเงื่อนไขการให้บริการของเรา</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
