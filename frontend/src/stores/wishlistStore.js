import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';

export const useWishlistStore = defineStore('wishlist', {
    state: () => ({
        items: [],
        isLoading: false,
        error: null
    }),

    getters: {
        isInWishlist: (state) => (productId) => {
            return state.items.some(item => item.id === productId);
        },
        itemCount: (state) => state.items.length
    },

    actions: {
        async fetchWishlist() {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated) {
                this.items = [];
                return;
            }

            this.isLoading = true;
            this.error = null;
            try {
                const response = await fetch('/api/wishlists', {
                    headers: {
                        'Authorization': `Bearer ${authStore.token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    this.items = data.data;
                } else {
                    this.error = data.error || 'Failed to fetch wishlist';
                }
            } catch (err) {
                console.error('Error fetching wishlist:', err);
                this.error = err.message;
            } finally {
                this.isLoading = false;
            }
        },

        async toggleWishlist(product) {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated) {
                return { success: false, error: 'unauthenticated' };
            }

            const productId = product.id;
            const exists = this.isInWishlist(productId);

            try {
                // Optimistic UI Update
                if (exists) {
                    this.items = this.items.filter(item => item.id !== productId);
                } else {
                    this.items.push(product);
                }

                const url = exists ? `/api/wishlists/${productId}` : '/api/wishlists';
                const method = exists ? 'DELETE' : 'POST';
                const body = exists ? null : JSON.stringify({ product_id: productId });
                
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${authStore.token}`,
                        ...(body && { 'Content-Type': 'application/json' })
                    },
                    body
                });
                
                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.error || 'Failed to update wishlist server state');
                }
                
                return { success: true, isAdded: !exists };
            } catch (err) {
                console.error('Error toggling wishlist:', err);
                // Revert optimistic update
                if (exists) {
                    this.items.push(product);
                } else {
                    this.items = this.items.filter(item => item.id !== productId);
                }
                return { success: false, error: err.message };
            }
        },

        clearWishlist() {
            this.items = [];
        }
    }
});
