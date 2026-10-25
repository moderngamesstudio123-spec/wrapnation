import { test, expect } from '@playwright/test';

test.describe('Live Vercel Production Verification', () => {
  test.use({ baseURL: 'https://wrapnation.vercel.app' });

  test('Customer table QR scan -> menu -> cart -> place order -> receipt on Vercel', async ({ page }) => {
    // 1. Visit Table 1 QR verification link on Vercel
    const tableUrl = '/t/1.eacdf66d5eb48ebe36418030bf584b5a517c607243d679e1c536c91a1f845992';
    await page.goto(tableUrl);

    // Wait for redirect to /menu
    await page.waitForURL('**/menu', { timeout: 15000 });

    // Verify Dine-in: Table #1 badge is visible
    await expect(page.locator('text=Dine-in: Table #1')).toBeVisible({ timeout: 10000 });

    // Verify Categories and Items load on Vercel
    await expect(page.locator('text=Wraps').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Chicken Wrap').first()).toBeVisible({ timeout: 10000 });

    // Click ADD button on Chicken Wrap
    const addBtn = page.locator('button:has-text("ADD")').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // If customization modal opens, confirm adding to cart
    const addToCartModalBtn = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartModalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addToCartModalBtn.click();
    }

    // Bottom Cart Bar should appear with View Cart button
    const viewCartBtn = page.locator('a:has-text("View Cart"), button:has-text("View Cart")').first();
    await expect(viewCartBtn).toBeVisible({ timeout: 10000 });
    await viewCartBtn.click();

    // Wait for /cart page
    await page.waitForURL('**/cart', { timeout: 10000 });
    await expect(page.locator('text=Order Summary').or(page.locator('text=Review Order')).or(page.locator('text=Your Order')).or(page.locator('text=Table #1'))).toBeVisible({ timeout: 10000 });

    // Select Cash payment method
    const cashBtn = page.locator('button:has-text("Cash"), label:has-text("Cash")').first();
    if (await cashBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cashBtn.click();
    }

    // Click Place Order
    const placeOrderBtn = page.locator('button:has-text("Place Order")').first();
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // Should redirect to /order/[id]
    await page.waitForURL('**/order/**', { timeout: 20000 });
    expect(page.url()).toContain('/order/');

    // Verify Order details on the tracking page
    await expect(page.locator('text=Order #').or(page.locator('text=Token')).first()).toBeVisible({ timeout: 15000 });

    // Verify 80mm single customer bill receipt
    const receipt = page.locator('.thermal-receipt-80mm');
    await expect(receipt).toBeAttached({ timeout: 10000 });
    const receiptText = await receipt.textContent();
    expect(receiptText).toContain('Wrap Nation');
    expect(receiptText).toContain('81250 57086');
    expect(receiptText).toContain('THANK YOU');

    // Verify Print Bill button is present
    const printBillBtn = page.locator('button:has-text("Print Bill"), button:has-text("Print")').first();
    await expect(printBillBtn).toBeVisible();
  });

  test('Owner login on Vercel', async ({ page }) => {
    // Navigate to /login on Vercel
    await page.goto('/login');

    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });

    // Fill Owner credentials
    await page.fill('input[type="email"]', 'owner@wrapnation.com');
    await page.fill('input[type="password"]', 'Owner@123456');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to /admin dashboard
    await page.waitForURL('**/admin', { timeout: 15000 });
    expect(page.url()).toContain('/admin');

    // Check Admin dashboard content is displayed
    await expect(page.locator('text=Wrap Nation').first()).toBeVisible();
  });

  test('Staff login on Vercel', async ({ page }) => {
    // Navigate to /login on Vercel
    await page.goto('/login');

    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });

    // Fill Staff credentials
    await page.fill('input[type="email"]', 'staff@wrapnation.com');
    await page.fill('input[type="password"]', 'Staff@123456');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to /admin (staff can also view orders/operations)
    await page.waitForURL('**/admin', { timeout: 15000 });
    expect(page.url()).toContain('/admin');
  });
});
