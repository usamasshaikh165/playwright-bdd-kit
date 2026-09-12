import { expect, test } from '@playwright/test';

import { login } from './helpers/auth.helper';
import { InventoryPage } from './pages/inventory.page';

/**
 * Automates features/InventoryCart/InventoryCart.feature (story PBK-102).
 */
const PRODUCT_A = 'Sauce Labs Backpack';
const PRODUCT_B = 'Sauce Labs Bike Light';

test.describe('Inventory Cart', () => {
  let inventory: InventoryPage;

  test.beforeEach(async ({ page }) => {
    await login(page);
    inventory = new InventoryPage(page);
  });

  // ── Happy Path ────────────────────────────────────────────────────────────

  test('@smoke PBK-C10 should add one product and show a cart count of 1', async () => {
    await inventory.addToCart(PRODUCT_A);

    await inventory.expectCartCount(1);
    await expect(inventory.removeButton(PRODUCT_A)).toBeVisible();
  });

  test('@smoke PBK-C11 should list every added product on the cart page', async () => {
    await inventory.addToCart(PRODUCT_A);
    await inventory.addToCart(PRODUCT_B);
    await inventory.expectCartCount(2);

    await inventory.openCart();

    await expect(inventory.cartItems).toHaveCount(2);
    await expect(inventory.cartItems.filter({ hasText: PRODUCT_A })).toBeVisible();
    await expect(inventory.cartItems.filter({ hasText: PRODUCT_B })).toBeVisible();
  });

  // ── Business Rules & Restrictions ─────────────────────────────────────────

  test('@regression PBK-C12 should decrement the count when a product is removed', async () => {
    await inventory.addToCart(PRODUCT_A);
    await inventory.addToCart(PRODUCT_B);
    await inventory.expectCartCount(2);

    await inventory.removeFromCart(PRODUCT_A);

    await inventory.expectCartCount(1);
    await expect(inventory.addToCartButton(PRODUCT_A)).toBeVisible();
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  test('@regression PBK-C13 should hide the badge when the cart is emptied', async () => {
    await inventory.addToCart(PRODUCT_A);
    await inventory.expectCartCount(1);

    await inventory.removeFromCart(PRODUCT_A);

    await inventory.expectCartCount(0);
  });

  test('@regression PBK-C14 should start every session with an empty cart', async () => {
    await inventory.expectCartCount(0);
    await inventory.openCart();

    await expect(inventory.cartItems).toHaveCount(0);
  });
});
