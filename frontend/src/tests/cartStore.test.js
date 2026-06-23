import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';

// Mock dependencies
vi.mock('../composables/useToast', () => ({
    useToast: () => ({ showToast: vi.fn() })
}));

vi.mock('../utils/apiFetch', () => ({
    apiFetch: vi.fn()
}));

describe('Cart Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        // Reset localStorage
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('initializes with empty cart', () => {
        const cart = useCartStore();
        expect(cart.items).toEqual([]);
        expect(cart.cartTotal).toBe(0);
        expect(cart.subtotal).toBe(0);
    });

    it('adds product to guest cart and saves to localStorage', () => {
        const cart = useCartStore();
        const product = { id: 'prod-1', price: 100 };
        
        // Mock auth to be false
        const auth = useAuthStore();
        auth.isAuthenticated = false;

        cart.addToCart(product, 2);

        expect(cart.items.length).toBe(1);
        expect(cart.items[0].id).toBe('prod-1');
        expect(cart.items[0].quantity).toBe(2);
        
        // Ensure localStorage was updated
        const saved = JSON.parse(localStorage.getItem('guest_cart'));
        expect(saved.length).toBe(1);
        expect(saved[0].id).toBe('prod-1');
    });

    it('calculates totals correctly with multiple items', () => {
        const cart = useCartStore();
        cart.items = [
            { id: '1', price: 150.50, quantity: 2 },
            { id: '2', price: 200, quantity: 1 }
        ];

        expect(cart.cartTotal).toBe(3); // 2 + 1
        expect(cart.subtotal).toBe(501); // (150.5 * 2) + 200
    });

    it('calculates discount total', () => {
        const cart = useCartStore();
        cart.items = [
            { id: '1', price: 100, original_price: 150, quantity: 2 }, // Discount: 50 * 2 = 100
            { id: '2', price: 200, original_price: 200, quantity: 1 }  // No discount
        ];

        expect(cart.discountTotal).toBe(100);
    });
});
