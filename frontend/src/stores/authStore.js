import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useCartStore } from './cartStore';

export const useAuthStore = defineStore('auth', () => {
    // State
    const token = ref(localStorage.getItem('customer_token') || null);
    const user = ref(JSON.parse(localStorage.getItem('customer_user')) || null);

    // Getters
    const isAuthenticated = computed(() => !!token.value);
    const currentUser = computed(() => user.value);

    // Actions
    const login = async (userData, userToken) => {
        token.value = userToken;
        user.value = userData;
        localStorage.setItem('customer_token', userToken);
        localStorage.setItem('customer_user', JSON.stringify(userData));

        const cartStore = useCartStore();
        await cartStore.syncCartOnLogin();
    };

    const logout = () => {
        token.value = null;
        user.value = null;
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_user');

        const cartStore = useCartStore();
        cartStore.clearCart();
    };

    const updateProfile = (newData) => {
        if (user.value) {
            user.value = { ...user.value, ...newData };
            localStorage.setItem('customer_user', JSON.stringify(user.value));
        }
    };

    return {
        token,
        user,
        isAuthenticated,
        currentUser,
        login,
        logout,
        updateProfile
    };
});
