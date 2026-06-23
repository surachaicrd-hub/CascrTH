import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './authStore';
import { apiFetch } from '../utils/apiFetch';
import { useToast } from '../composables/useToast';

export const useCartStore = defineStore('cart', () => {
    const items = ref([]);
    const loading = ref(false);
    const { showToast } = useToast();

    // ===============
    // Getters
    // ===============
    const cartTotal = computed(() => {
        return items.value.reduce((total, item) => total + (item.quantity || 1), 0);
    });

    const subtotal = computed(() => {
        return items.value.reduce((total, item) => {
            const price = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
            return total + (price * (item.quantity || 1));
        }, 0);
    });

    const discountTotal = computed(() => {
        return items.value.reduce((total, item) => {
            const price = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
            const originalPrice = item.original_price ? parseFloat(String(item.original_price).replace(/[^0-9.]/g, '')) : 0;

            if (originalPrice > price) {
                return total + ((originalPrice - price) * (item.quantity || 1));
            }
            return total;
        }, 0);
    });

    // ===============
    // Actions
    // ===============

    // Load cart from API or LocalStorage
    const fetchCart = async () => {
        const authStore = useAuthStore();

        if (authStore.isAuthenticated) {
            loading.value = true;
            try {
                const res = await apiFetch('/api/cart', {
                    headers: { 'Authorization': `Bearer ${authStore.token}` }
                });
                const data = await res.json();
                if (data.success) {
                    items.value = data.data;
                }
            } catch (err) {
                console.error('Failed to fetch cart:', err);
            } finally {
                loading.value = false;
            }
        } else {
            // Load from LocalStorage
            const localCart = localStorage.getItem('guest_cart');
            if (localCart) {
                try {
                    items.value = JSON.parse(localCart);
                } catch (e) {
                    items.value = [];
                }
            } else {
                items.value = [];
            }
        }
    };

    // Save Guest Cart
    const saveGuestCart = () => {
        localStorage.setItem('guest_cart', JSON.stringify(items.value));
    };

    // Add Item
    const addToCart = async (product, quantity = 1) => {
        const authStore = useAuthStore();

        if (product.limit_one_per_order && quantity > 1) {
            showToast('สินค้านี้จำกัดการสั่งซื้อ 1 ชิ้นต่อ 1 คำสั่งซื้อ', 'warning');
            return;
        }

        const currentQtyInCart = authStore.isAuthenticated 
            ? (items.value.find(i => i.product_id === product.id)?.quantity || 0) 
            : (items.value.find(i => i.id === product.id)?.quantity || 0);

        if (product.stock_quantity !== null && (currentQtyInCart + quantity) > product.stock_quantity) {
            showToast(`คุณสามารถซื้อได้สูงสุดแค่ ${product.stock_quantity} ชิ้นที่มีในสต๊อกตอนนี้`, 'warning');
            return;
        }

        if (authStore.isAuthenticated) {
            loading.value = true;
            try {
                const res = await apiFetch('/api/cart', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authStore.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ product_id: product.id, quantity })
                });
                const data = await res.json();
                if (data.success) {
                    await fetchCart(); // Refresh from DB
                } else {
                    showToast(data.error || 'ไม่สามารถเพิ่มสินค้าได้', 'error');
                }
            } catch (err) {
                console.error('AddToCart Error:', err);
                showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            } finally {
                loading.value = false;
            }
        } else {
            // Guest Flow
            const existingItemIndex = items.value.findIndex(item => item.id === product.id);
            if (existingItemIndex > -1) {
                if (product.limit_one_per_order) {
                    showToast('สินค้านี้จำกัดการสั่งซื้อ 1 ชิ้นต่อ 1 คำสั่งซื้อ', 'warning');
                    return;
                }
                items.value[existingItemIndex].quantity += quantity;
            } else {
                // Formatting product similarly to DB fetch
                items.value.push({
                    ...product,
                    quantity,
                    price: parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0,
                    original_price: product.original_price ? parseFloat(String(product.original_price).replace(/[^0-9.]/g, '')) : null
                });
            }
            saveGuestCart();
        }
    };

    // Update Quantity
    const updateQuantity = async (productId, cartItemId, newQuantity) => {
        if (newQuantity < 1) return;

        const itemInCart = items.value.find(i => cartItemId ? i.cart_item_id === cartItemId : i.id === productId);
        if (itemInCart && itemInCart.limit_one_per_order && newQuantity > 1 && newQuantity > itemInCart.quantity) {
            showToast('สินค้านี้จำกัดการสั่งซื้อ 1 ชิ้นต่อ 1 คำสั่งซื้อ', 'warning');
            return;
        }

        if (itemInCart && itemInCart.stock_quantity !== null && newQuantity > itemInCart.stock_quantity && newQuantity > itemInCart.quantity) {
            showToast(`เกินสต๊อก! สินค้าเหลือแค่ ${itemInCart.stock_quantity} ชิ้น`, 'warning');
            return;
        }

        const authStore = useAuthStore();

        if (authStore.isAuthenticated) {
            if (!cartItemId) return;
            loading.value = true;
            try {
                const res = await apiFetch(`/api/cart/${cartItemId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authStore.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ quantity: newQuantity })
                });
                const data = await res.json();
                if (data.success) {
                    // Optmistic Update for Speed
                    const item = items.value.find(i => i.cart_item_id === cartItemId);
                    if (item) item.quantity = newQuantity;
                }
            } catch (err) {
                console.error('Update quantity error:', err);
            } finally {
                loading.value = false;
            }
        } else {
            // Guest Flow
            const item = items.value.find(i => i.id === productId);
            if (item) {
                item.quantity = newQuantity;
                saveGuestCart();
            }
        }
    };

    // Remove Item
    const removeFromCart = async (productId, cartItemId) => {
        const authStore = useAuthStore();

        if (authStore.isAuthenticated) {
            if (!cartItemId) return;
            loading.value = true;
            try {
                const res = await apiFetch(`/api/cart/${cartItemId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authStore.token}` }
                });
                const data = await res.json();
                if (data.success) {
                    items.value = items.value.filter(i => i.cart_item_id !== cartItemId);
                }
            } catch (err) {
                console.error('Remove item error:', err);
            } finally {
                loading.value = false;
            }
        } else {
            // Guest Flow
            items.value = items.value.filter(i => i.id !== productId);
            saveGuestCart();
        }
    };

    // Auto-sync local storage to DB on login
    const syncCartOnLogin = async () => {
        const localCart = localStorage.getItem('guest_cart');
        if (!localCart) {
            await fetchCart(); // Just load DB cart
            return;
        }

        let parsedLocal = [];
        try {
            parsedLocal = JSON.parse(localCart);
        } catch (e) {
            // JSON parse error
        }

        if (parsedLocal.length === 0) {
            await fetchCart();
            return;
        }

        const authStore = useAuthStore();
        if (!authStore.isAuthenticated) return;

        // Simplify payload for sync
        const syncPayload = parsedLocal.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        }));

        loading.value = true;
        try {
            await apiFetch('/api/cart/sync', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authStore.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: syncPayload })
            });
            // Clear local storage after successful sync
            localStorage.removeItem('guest_cart');
            await fetchCart(); // Reload merged cart from DB
        } catch (err) {
            console.error('Sync cart error:', err);
        } finally {
            loading.value = false;
        }
    };

    const clearCart = () => {
        items.value = [];
        localStorage.removeItem('guest_cart');
    };

    return {
        items,
        loading,
        cartTotal,
        subtotal,
        discountTotal,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        syncCartOnLogin,
        clearCart
    };
});
