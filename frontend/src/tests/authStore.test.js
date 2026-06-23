import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

describe('Auth Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('initializes as unauthenticated by default', () => {
        const auth = useAuthStore();
        expect(auth.isAuthenticated).toBe(false);
        expect(auth.currentUser).toBeNull();
        expect(auth.token).toBeNull();
    });

    it('logs in user and sets local storage', async () => {
        const auth = useAuthStore();
        const cart = useCartStore();
        cart.syncCartOnLogin = vi.fn().mockResolvedValue(true);

        const mockUser = { id: 'u1', name: 'John Doe' };
        const mockToken = 'jwt-mock-token';

        await auth.login(mockUser, mockToken);

        expect(auth.isAuthenticated).toBe(true);
        expect(auth.currentUser).toEqual(mockUser);
        expect(auth.token).toBe(mockToken);
        expect(localStorage.getItem('customer_token')).toBe(mockToken);
        expect(JSON.parse(localStorage.getItem('customer_user'))).toEqual(mockUser);
        expect(cart.syncCartOnLogin).toHaveBeenCalledTimes(1);
    });

    it('logs out user and clears local storage', async () => {
        const auth = useAuthStore();
        const cart = useCartStore();
        cart.clearCart = vi.fn();

        // Preset state
        auth.token = 'existing-token';
        auth.user = { id: '1' };
        localStorage.setItem('customer_token', 'existing-token');

        auth.logout();

        expect(auth.isAuthenticated).toBe(false);
        expect(auth.token).toBeNull();
        expect(localStorage.getItem('customer_token')).toBeNull();
        expect(cart.clearCart).toHaveBeenCalledTimes(1);
    });

    it('updates user profile correctly', () => {
        const auth = useAuthStore();
        auth.user = { id: 'u1', name: 'John', phone: '111' };
        
        auth.updateProfile({ phone: '222', lastName: 'Doe' });

        expect(auth.currentUser.phone).toBe('222');
        expect(auth.currentUser.lastName).toBe('Doe');
        expect(auth.currentUser.name).toBe('John'); // Preserves untouched fields
        
        // Checks local storage
        const saved = JSON.parse(localStorage.getItem('customer_user'));
        expect(saved.phone).toBe('222');
    });
});
