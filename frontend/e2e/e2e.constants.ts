/**
 * Shared password of the stack under test: the demo one of the compose stack unless overridden.
 */
export const PASSWORD = process.env['E2E_PASSWORD'] ?? 'job-finder-demo-password';

/**
 * Session token saved by the setup project and reused by every test (gitignored).
 */
export const SESSION_FILE = 'e2e/.auth/session.json';
