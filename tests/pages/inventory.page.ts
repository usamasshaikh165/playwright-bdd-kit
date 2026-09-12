import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object for the product list ("inventory") and the cart badge in the
 * header. Also covers the cart page reached from the badge, because the two
 * are exercised together in every cart scenario.
 */
export class InventoryPage {
  readonly heading: Locator;
  readonly productCards: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly cartItems: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByText('Products', { exact: true });
    this.productCards = page.locator('.inventory_item');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.cartItems = page.locator('.cart_item');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory/);
    await expect(this.heading).toBeVisible();
    await expect(this.productCards.first()).toBeVisible();
  }

  /** The "Add to cart" button inside the card whose name matches. */
  addToCartButton(productName: string): Locator {
    return this.productCards
      .filter({ hasText: productName })
      .getByRole('button', { name: 'Add to cart' });
  }

  /** The "Remove" button inside the card whose name matches. */
  removeButton(productName: string): Locator {
    return this.productCards
      .filter({ hasText: productName })
      .getByRole('button', { name: 'Remove' });
  }

  async addToCart(productName: string): Promise<void> {
    await this.addToCartButton(productName).click();
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.removeButton(productName).click();
  }

  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
      return;
    }
    await expect(this.cartBadge).toHaveText(String(count));
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/cart/);
  }
}
