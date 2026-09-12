import MailosaurClient from 'mailosaur';
import { Page } from '@playwright/test';

/**
 * Configuration for Mailosaur — values must be set in .env (see .env.example)
 */
export const MAILOSAUR_CONFIG = {
  apiKey: process.env.MAILOSAUR_API_KEY ?? '',
  serverId: process.env.MAILOSAUR_SERVER_ID ?? '',
};

/**
 * Generates a test email address using Mailosaur
 * @param prefix - Optional prefix for the email (default: 'test')
 * @returns A Mailosaur email address
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}@${MAILOSAUR_CONFIG.serverId}.mailosaur.net`;
}

/**
 * Clears all emails from the Mailosaur inbox
 */
export async function clearMailosaurInbox(): Promise<void> {
  const mailosaur = new MailosaurClient(MAILOSAUR_CONFIG.apiKey);
  await mailosaur.messages.deleteAll(MAILOSAUR_CONFIG.serverId);
}

/**
 * Retrieves the OTP code from the most recent email
 * @param emailAddress - The email address to check
 * @param timeout - Timeout in milliseconds (default: 60000)
 * @returns The OTP code as a string
 * @throws Error if no verification code is found or code is invalid
 */
export async function getOTPFromEmail(
  emailAddress: string,
  timeout: number = 60000
): Promise<string> {
  const mailosaur = new MailosaurClient(MAILOSAUR_CONFIG.apiKey);

  // Wait for the email with a timeout
  const email = await mailosaur.messages.get(
    MAILOSAUR_CONFIG.serverId,
    {
      sentTo: emailAddress,
    },
    {
      timeout: timeout,
    }
  );

  // Check if codes exist before accessing
  if (!email.html || !email.html.codes || email.html.codes.length === 0) {
    throw new Error('No verification code found in email');
  }

  const verificationCode = email.html.codes[0].value;

  // Ensure verificationCode is a string and has at least 6 characters
  if (!verificationCode || verificationCode.length < 6) {
    throw new Error('Verification code is invalid or too short');
  }

  return verificationCode;
}

/**
 * Fills a one-character-per-box OTP input.
 *
 * Boxes are located by accessible name using `labelPattern`, where `{n}` is
 * replaced by the 1-based box index. The default matches inputs labelled
 * "Please enter OTP character 1" ... "Please enter OTP character N".
 * @param page - Playwright page object
 * @param verificationCode - The code to type, one character per box
 * @param labelPattern - Accessible-name template for each box
 */
export async function fillOTPFields(
  page: Page,
  verificationCode: string,
  labelPattern: string = 'Please enter OTP character {n}',
): Promise<void> {
  for (let i = 0; i < verificationCode.length; i++) {
    const box = page.getByRole('textbox', { name: labelPattern.replace('{n}', String(i + 1)) });
    await box.fill(verificationCode[i]);
  }
}

/**
 * Complete OTP workflow: clear inbox, get OTP from email, and fill OTP fields
 * @param page - Playwright page object
 * @param emailAddress - The email address to check
 * @param timeout - Timeout in milliseconds (default: 60000)
 */
export async function handleOTPWorkflow(
  page: Page,
  emailAddress: string,
  timeout: number = 60000
): Promise<void> {
  // Get OTP from email
  const verificationCode = await getOTPFromEmail(emailAddress, timeout);

  // Fill OTP fields
  await fillOTPFields(page, verificationCode);
}
