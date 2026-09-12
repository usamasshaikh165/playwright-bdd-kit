/**
 * Runs once before the whole test run.
 *
 * Set ALLOW_SELF_SIGNED_CERTS=1 in .env when your test environment (or a
 * mailbox API proxy) uses a self-signed certificate. It is opt-in on purpose:
 * disabling TLS verification globally should never be the silent default.
 */
async function globalSetup(): Promise<void> {
  if (process.env.ALLOW_SELF_SIGNED_CERTS === '1') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

export default globalSetup;
