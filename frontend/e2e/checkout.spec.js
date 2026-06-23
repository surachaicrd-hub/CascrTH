import { test, expect } from '@playwright/test';

test.describe('Checkout Flow E2E', () => {
    test('Product detail page has add-to-cart or quotation button', async ({ page }) => {
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        // Find an in-stock product link (skip the first one if it's out of stock)
        // Look for links that go to /products/xxx
        const productLinks = page.locator('a[href*="/products/"]');
        const count = await productLinks.count();

        if (count > 1) {
            // Click the SECOND product (first may be out of stock based on test data)
            await productLinks.nth(1).click();
        } else if (count > 0) {
            await productLinks.first().click();
        } else {
            // No products, skip test
            return;
        }

        await page.waitForURL(/\/products\/.+/);
        await page.waitForLoadState('networkidle');

        // Wait for the product detail page to fully load
        const productTitle = page.locator('h1').first();
        await expect(productTitle).toBeVisible({ timeout: 15000 });

        // Product detail should have at least one of these action elements:
        // 1. "เพิ่มลงตะกร้า" button (online shopping enabled & in stock)
        // 2. "สินค้าหมด" text (out of stock)
        // 3. "ขอใบเสนอราคาสินค้านี้" link (always present)
        const quotationLink = page.locator('a:has-text("ขอใบเสนอราคาสินค้านี้")');
        const addToCartBtn = page.locator('button:has-text("เพิ่มลงตะกร้า")');
        const outOfStockText = page.locator('text=สินค้าหมด');

        const quotationVisible = await quotationLink.isVisible({ timeout: 5000 }).catch(() => false);
        const cartVisible = await addToCartBtn.isVisible({ timeout: 2000 }).catch(() => false);
        const oosVisible = await outOfStockText.isVisible({ timeout: 2000 }).catch(() => false);

        expect(quotationVisible || cartVisible || oosVisible).toBeTruthy();
    });

    test('Cart page shows summary or empty state', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');

        // Either "สรุปคำสั่งซื้อ" (populated cart) or "ตะกร้าของคุณยังว่างเปล่า" (empty)
        const summary = page.locator('text=สรุปคำสั่งซื้อ');
        const empty = page.locator('text=ตะกร้าของคุณยังว่างเปล่า');

        const summaryVisible = await summary.isVisible({ timeout: 5000 }).catch(() => false);
        const emptyVisible = await empty.isVisible({ timeout: 2000 }).catch(() => false);

        expect(summaryVisible || emptyVisible).toBeTruthy();
    });
});
