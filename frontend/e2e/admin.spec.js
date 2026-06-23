import { test, expect } from '@playwright/test';

test.describe('Admin Panel E2E tests', () => {
  test('Admin page redirects to login if unauthenticated', async ({ page }) => {
    await page.goto('/admin');

    // Should automatically redirect to /admin/login because of auth guard
    await expect(page).toHaveURL(/.*\/admin\/login/);

    // Admin login page has heading "Admin System"
    await expect(page.locator('text=Admin System')).toBeVisible();

    // Verify login form elements
    const usernameInput = page.locator('#username');
    await expect(usernameInput).toBeVisible();
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();

    // Verify the submit button text 
    const loginBtn = page.locator('button[type="submit"]:has-text("เข้าสู่ระบบ Admin")');
    await expect(loginBtn).toBeVisible();

    // Verify "back to homepage" link
    const backLink = page.locator('text=กลับสู่หน้าแรกเว็บไซต์');
    await expect(backLink).toBeVisible();
  });
});
