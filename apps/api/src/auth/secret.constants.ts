/**
 * scrypt parameters: N=2^15, r=8, p=1 (~50 ms, ~32 MiB).
 */
export const SCRYPT_OPTIONS = {
  N: 2 ** 15,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

/**
 * Derived key length, in bytes.
 */
export const KEY_LENGTH = 64;

/**
 * Salt length of a stored password hash, in bytes.
 */
export const SALT_LENGTH = 16;

/**
 * Session token length, in bytes: 256 bits of randomness.
 */
export const TOKEN_LENGTH = 32;
