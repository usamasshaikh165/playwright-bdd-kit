import { expect, test } from '@playwright/test';

import { INVALID_USER, TEST_USERS } from './fixtures/users.fixture';
import { InventoryPage } from './pages/inventory.page';
import { LoginPage } from './pages/login.page';

/**
 * Automates features/Login/Login.feature (story PBK-101).
 * Test titles carry the Vansah case key so a CI failure maps straight back
 * to the test-management record.
 */
test.describe('User Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // ── Happy Path ────────────────────────────────────────────────────────────

  test('@smoke PBK-C1 should show the product list after a valid login', async ({ page }) => {
    await loginPage.fillCredentials(TEST_USERS.default);
    await loginPage.submit();

    await new InventoryPage(page).expectLoaded();
  });

  // ── Validation / Negative ─────────────────────────────────────────────────

  test('@regression PBK-C2 should reject an unregistered user and stay on the login page', async () => {
    await loginPage.fillCredentials(INVALID_USER);
    await loginPage.submit();

    await loginPage.expectError('Username and password do not match');
    await loginPage.expectStillOnLogin();
  });

  test('@regression PBK-C3 should require a username', async () => {
    await loginPage.passwordInput.fill(TEST_USERS.default.password);
    await loginPage.submit();

    await loginPage.expectError('Username is required');
    await loginPage.expectStillOnLogin();
  });

  test('@regression PBK-C4 should require a password', async () => {
    await loginPage.usernameInput.fill(TEST_USERS.default.email);
    await loginPage.submit();

    await loginPage.expectError('Password is required');
    await loginPage.expectStillOnLogin();
  });

  // ── Business Rules & Restrictions ─────────────────────────────────────────

  test('@regression PBK-C5 should block a locked-out account with a clear message', async () => {
    await loginPage.fillCredentials(TEST_USERS.locked);
    await loginPage.submit();

    await loginPage.expectError('this user has been locked out');
    await loginPage.expectStillOnLogin();
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  test('@regression PBK-C6 should treat the username as case-sensitive', async () => {
    await loginPage.fillCredentials({
      email: TEST_USERS.default.email.toUpperCase(),
      password: TEST_USERS.default.password,
    });
    await loginPage.submit();

    await loginPage.expectError('Username and password do not match');
    await expect(loginPage.loginButton).toBeVisible();
  });
});
