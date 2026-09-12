/**
 * Test accounts, sourced from .env (see .env.example).
 *
 * Values are read lazily through getters so a missing variable fails at the
 * moment a test actually needs it, with a message naming the variable, instead
 * of surfacing later as an opaque 400/401 from the application.
 */
export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy .env.example to .env and fill it in. Tests cannot authenticate without it.`,
    );
  }
  return value;
};

const credentialsFromEnv = (emailVar: string, passwordVar: string): LoginCredentials => ({
  get email(): string {
    return requireEnv(emailVar);
  },
  get password(): string {
    return requireEnv(passwordVar);
  },
});

export const TEST_USERS = {
  /** Standard account that can log in and use the application. */
  default: credentialsFromEnv('DEFAULT_USER_EMAIL', 'DEFAULT_USER_PASSWORD'),
  /** Account the application refuses to sign in (locked / disabled). */
  locked: credentialsFromEnv('LOCKED_USER_EMAIL', 'LOCKED_USER_PASSWORD'),
} as const;

/** Credentials that must never match a real account. */
export const INVALID_USER: LoginCredentials = {
  email: 'no-such-user',
  password: 'wrong-password',
};
