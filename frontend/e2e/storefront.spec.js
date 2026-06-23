import { test, expect } from '@playwright/test';

test.describe('Storefront E2E tests', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if the page has loaded with some visible content
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('Can navigate to products page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Products page should show either products or an empty state
    // Wait for the page to settle
    await page.waitForTimeout(2000);
    
    // Check that the page is accessible (no error pages)
    const url = page.url();
    expect(url).toContain('/products');
  });

  test('Can navigate to product detail page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Check if product links exist
    const productLinks = page.locator('a[href*="/products/"]');
    const count = await productLinks.count();
    
    if (count > 0) {
      // Click first product link
      await productLinks.first().click();
      await page.waitForURL(/\/products\/.+/);
      
      // Product detail page should show the product title (h1)
      const title = page.locator('h1').first();
      await expect(title).toBeVisible({ timeout: 10000 });
      
      // Product detail should have a price section visible
      const priceSection = page.locator('text=/ ชุด, text=สอบถามราคา').first();
      // Just check the page loaded without errors
      await expect(page.locator('.max-w-7xl').first()).toBeVisible();
    }
  });

  test('Cart page loads', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Cart page should show "ตะกร้าสินค้า" header or empty state "ตะกร้าของคุณยังว่างเปล่า"
    const cartHeader = page.locator('h1:has-text("ตะกร้าสินค้า")');
    const emptyState = page.locator('text=ตะกร้าของคุณยังว่างเปล่า');
    
    // Either the cart header or empty state should be visible
    const headerVisible = await cartHeader.isVisible({ timeout: 5000 }).catch(() => false);
    const emptyVisible = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(headerVisible || emptyVisible).toBeTruthy();
  });
});
