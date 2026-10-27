import {
  createHmac,
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 bytes.');
  }
  return secret;
}

export function assertJwtSecret() {
  getJwtSecret();
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: 32 * 1024 * 1024,
  });
  return `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password, encodedHash) {
  if (typeof encodedHash !== 'string') return false;
  const [algorithm, cost, blockSize, parallelization, saltText, keyText, extra] = encodedHash.split('$');
  if (
    algorithm !== 'scrypt'
    || Number(cost) !== SCRYPT_COST
    || Number(blockSize) !== SCRYPT_BLOCK_SIZE
    || Number(parallelization) !== SCRYPT_PARALLELIZATION
    || !saltText
    || !keyText
    || extra !== undefined
  ) {
    return false;
  }

  const salt = Buffer.from(saltText, 'base64url');
  const expectedKey = Buffer.from(keyText, 'base64url');
  if (salt.length !== 16 || expectedKey.length !== KEY_LENGTH) return false;

  const actualKey = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: 32 * 1024 * 1024,
  });
  return timingSafeEqual(actualKey, expectedKey);
}

export function issueAccessToken(account) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: account.id,
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS,
    ver: account.token_version,
  })).toString('base64url');
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac('sha256', getJwtSecret()).update(unsignedToken).digest('base64url');
  return `${unsignedToken}.${signature}`;
}

export function verifyAccessToken(authorization) {
  const unauthorized = () => {
    const error = new Error('Sign in to continue.');
    error.statusCode = 401;
    return error;
  };
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    throw unauthorized();
  }

  const tokenParts = authorization.slice(7).split('.');
  if (tokenParts.length !== 3 || tokenParts.some((part) => !part)) throw unauthorized();

  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString('utf8'));
  } catch {
    throw unauthorized();
  }
  if (header.alg !== 'HS256' || header.typ !== 'JWT') throw unauthorized();

  const unsignedToken = `${tokenParts[0]}.${tokenParts[1]}`;
  const expectedSignature = createHmac('sha256', getJwtSecret())
    .update(unsignedToken)
    .digest();
  const suppliedSignature = Buffer.from(tokenParts[2], 'base64url');
  if (
    suppliedSignature.length !== expectedSignature.length
    || !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    throw unauthorized();
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    typeof payload.sub !== 'string'
    || !payload.sub
    || !Number.isInteger(payload.exp)
    || payload.exp <= now
    || !Number.isInteger(payload.ver)
    || !Number.isInteger(payload.iat)
    || payload.iat > now + 60
  ) {
    throw unauthorized();
  }
  return payload;
}

export function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createResetToken() {
  return randomBytes(32).toString('base64url');
}
