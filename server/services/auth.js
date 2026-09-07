import crypto from 'crypto';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');

  const hash = crypto
    .pbkdf2Sync(
      String(password),
      salt,
      ITERATIONS,
      KEY_LENGTH,
      DIGEST
    )
    .toString('hex');

  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;

  const parts = String(storedHash).split(':');

  if (parts.length !== 2) return false;

  const [salt, originalHash] = parts;

  const hash = crypto
    .pbkdf2Sync(
      String(password),
      salt,
      ITERATIONS,
      KEY_LENGTH,
      DIGEST
    )
    .toString('hex');

  const originalBuffer = Buffer.from(originalHash, 'hex');
  const currentBuffer = Buffer.from(hash, 'hex');

  if (originalBuffer.length !== currentBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(originalBuffer, currentBuffer);
}