import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E', () => {
    test('Login modal opens from navbar and shows login form', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Click the login button in the navbar
        const loginBtn = page.getByRole('button', { name: 'เข้าสู่ระบบ' }).first();
        await loginBtn.click();

        // Wait for the LoginModal to appear
        // Use the specific email placeholder from LoginModal (not footer newsletter)
        const emailInput = page.getByPlaceholder('your@email.com');
        await expect(emailInput).toBeVisible({ timeout: 5000 });

        // Verify password input exists (type="password" in LoginModal)
        const passwordInput = page.locator('input[type="password"]').first();
        await expect(passwordInput).toBeVisible();

        // Verify login submit button (inside the modal form, not the footer newsletter)
        const submitBtn = page.locator('button[type="submit"]').first();
        await expect(submitBtn).toBeVisible();

        // Verify register tab button exists
        const registerTab = page.locator('button:has-text("สมัครสมาชิกใหม่")');
        await expect(registerTab).toBeVisible();
    });

    test('Login modal register tab shows name fields', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Open login modal
        const loginBtn = page.getByRole('button', { name: 'เข้าสู่ระบบ' }).first();
        await loginBtn.click();

        // Wait for modal to appear
        const emailInput = page.getByPlaceholder('your@email.com');
        await expect(emailInput).toBeVisible({ timeout: 5000 });

        // Switch to Register tab
        const registerTab = page.locator('button:has-text("สมัครสมาชิกใหม่")');
        await registerTab.click();

        // Confirm password field should appear (2nd password input in the modal)
        const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
        await expect(confirmPasswordInput).toBeVisible({ timeout: 3000 });

        // Bot protection section should be visible
        const botSection = page.locator('text=ตรวจสอบความเป็นคน');
        await expect(botSection).toBeVisible();
    });
});
