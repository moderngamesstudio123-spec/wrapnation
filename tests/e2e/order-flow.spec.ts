import { test, expect } from '@playwright/test';

test.describe('Wrap Nation End-to-End Order Flow', () => {
  test('Customer orders takeaway, verifies cart, checks UPI QR, and submits UTR hint', async ({
    page,
  }) => {
    // 1. Visit Welcome Page
    await page.goto('/');
    await expect(page).toHaveTitle(/Wrap Nation/);
    await expect(page.locator('text=Order Takeaway')).toBeVisible();

    // 2. Click Order Takeaway to enter menu
    await page.click('text=Order Takeaway');
    await page.waitForURL('**/menu', { timeout: 10000 });
    await expect(page.locator('header').getByText('Takeaway', { exact: true })).toBeVisible();

    // 3. Verify category items appear
    await expect(page.getByRole('heading', { name: 'Chicken Wrap', exact: true })).toBeVisible();

    // 4. Add item to cart
    const addButtons = page.locator('button:has-text("ADD")');
    await expect(addButtons.first()).toBeVisible();
    await addButtons.first().click();

    // If customization modal opens, confirm addition
    const addToCartButton = page.locator('button:has-text("Add to Cart")');
    if (await addToCartButton.isVisible({ timeout: 2000 })) {
      await addToCartButton.click();
    }

    // 5. Verify bottom cart bar appears
    const viewCartBar = page.locator('a:has-text("View Cart")');
    await expect(viewCartBar).toBeVisible();
    await viewCartBar.click();

    // 6. On Cart page, enter customer details
    await page.waitForURL('**/cart');
    await expect(page.locator('h1:has-text("Your Cart")')).toBeVisible();

    await page.fill('input[placeholder="Your Name"]', 'Rohan Sharma');
    await page.fill('input[placeholder="9876543210"]', '9876543210');

    // 7. Place Order
    const placeOrderButton = page.locator('button:has-text("Place Order")');
    await expect(placeOrderButton).toBeVisible();
    await placeOrderButton.click();

    // 8. Order Status Tracking page
    await page.waitForURL('**/order/**', { timeout: 15000 });
    await expect(page.locator('text=Awaiting Payment Confirmation')).toBeVisible();
    await expect(page.locator('text=Scan to Pay via UPI')).toBeVisible();
    await expect(page.locator('text=Open in UPI App')).toBeVisible();

    // 9. Submit optional 4-digit customer hint
    const hintInput = page.locator('input[placeholder="e.g. 4821"]');
    if (await hintInput.isVisible()) {
      await hintInput.fill('4821');
      await page.click('button:has-text("Save Hint")');
      await expect(page.locator('text=Hint recorded for counter staff verification.')).toBeVisible();
    }
  });

  test('Staff can log in and view the Live Orders Board', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1:has-text("Wrap Nation POS")')).toBeVisible();

    await page.fill('input[type="email"]', 'staff@wrapnation.com');
    await page.fill('input[type="password"]', 'Staff@123456');
    await page.click('button[type="submit"]');

    // Either redirected to change-password or directly to admin
    await page.waitForURL(/\/(admin|change-password)/, { timeout: 10000 });

    if (page.url().includes('/change-password')) {
      await expect(page.locator('h1:has-text("Set New Password")')).toBeVisible();
    } else {
      await expect(page.locator('h1:has-text("Live Kitchen & Orders Board")')).toBeVisible();
    }
  });
});
