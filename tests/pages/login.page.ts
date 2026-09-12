import { expect, type Locator, type Page } from '@playwright/test';

import type { LoginCredentials } from '../fixtures/users.fixture';

/**
 * Page object for the login screen.
 *
 * Locator notes:
 * - Inputs are resolved by accessible name (placeholder text on the sample
 *   app). Prefer getByLabel when the application associates labels properly.
 * - The error banner is the one element on the page with data-test="error";
 *   it only exists after a failed submit.
 */
export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.locator('[data-test="error"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    // The form is not interactive the instant navigation resolves; filling
    // before it is visible silently leaves the fields empty.
    await this.usernameInput.waitFor({ state: 'visible' });
  }

  async fillCredentials(credentials: LoginCredentials): Promise<void> {
    await this.usernameInput.fill(credentials.email);
    await this.passwordInput.fill(credentials.password);
  }

  async submit(): Promise<void> {
    await this.loginButton.click();
  }

  async login(credentials: LoginCredentials): Promise<void> {
    await this.goto();
    await this.fillCredentials(credentials);
    await this.submit();
  }

  async expectError(text: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(text);
  }

  async expectStillOnLogin(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
    await expect(this.page).not.toHaveURL(/inventory/);
  }
}
