import type { Page } from '@playwright/test';

import { TEST_USERS, type LoginCredentials } from '../fixtures/users.fixture';
import { InventoryPage } from '../pages/inventory.page';
import { LoginPage } from '../pages/login.page';
import { handleOTPWorkflow } from './mailosaur.helper';

export { TEST_USERS, type LoginCredentials } from '../fixtures/users.fixture';

/**
 * Base URL for the application. playwright.config.ts also feeds this into
 * `use.baseURL`, so page.goto('/relative') works everywhere. Kept exported for
 * helpers that need to build absolute URLs.
 */
export const BASE_URL = process.env.BASE_URL ?? 'https://www.saucedemo.com';

/**
 * Signs in and waits until the first authenticated screen is usable.
 * @param page - Playwright page object
 * @param credentials - Defaults to the standard test account from .env
 */
export async function login(
  page: Page,
  credentials: LoginCredentials = TEST_USERS.default,
): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(credentials);
  await new InventoryPage(page).expectLoaded();
}

/**
 * Signs in on an application that sends a one-time code by email, reading the
 * code from a Mailosaur inbox. Requires MAILOSAUR_* in .env.
 * @param page - Playwright page object
 * @param emailAddress - Mailosaur address the code is sent to
 * @param password - Account password
 * @param submitOTP - Click the submit button after filling the code (default true)
 */
export async function loginWithOTP(
  page: Page,
  emailAddress: string,
  password: string,
  submitOTP: boolean = true,
): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login({ email: emailAddress, password });

  await handleOTPWorkflow(page, emailAddress);

  if (submitOTP) {
    await page.getByRole('button', { name: 'Submit' }).click();
  }
}

/**
 * Navigates to a path on the application (assumes the user is already logged in).
 * @param page - Playwright page object
 * @param path - Absolute URL or a path relative to BASE_URL
 */
export async function navigateToPage(page: Page, path: string): Promise<void> {
  const url = path.startsWith('http')
    ? path
    : `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  await page.goto(url);
}
