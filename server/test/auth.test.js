import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hashPassword,
  issueAccessToken,
  verifyAccessToken,
  verifyPassword,
} from '../src/auth.js';
import {
  loginSchema,
  passwordResetSchema,
  registerSchema,
} from '../src/validation.js';

process.env.JWT_SECRET = 'test-secret-for-auth-unit-tests-only-32-bytes';

test('stores passwords as salted scrypt hashes and verifies them', async () => {
  const firstHash = await hashPassword('a long test password');
  const secondHash = await hashPassword('a long test password');

  assert.notEqual(firstHash, secondHash);
  assert.equal(await verifyPassword('a long test password', firstHash), true);
  assert.equal(await verifyPassword('a different password', firstHash), false);
  assert.equal(await verifyPassword('a long test password', 'invalid'), false);
});

test('signs access tokens and rejects tampered tokens', () => {
  const account = { id: 'account-id', token_version: 2 };
  const token = issueAccessToken(account);

  assert.equal(verifyAccessToken(`Bearer ${token}`).sub, account.id);
  assert.equal(verifyAccessToken(`Bearer ${token}`).ver, account.token_version);
  assert.throws(() => verifyAccessToken(`Bearer ${token.slice(0, -1)}x`), { statusCode: 401 });
  assert.throws(() => verifyAccessToken('Bearer invalid'), { statusCode: 401 });
});

test('validates account credentials and password reset payloads', () => {
  assert.deepEqual(registerSchema.parse({
    name: 'Customer Example',
    email: ' CUSTOMER@EXAMPLE.COM ',
    password: 'a long test password',
  }), {
    name: 'Customer Example',
    email: 'customer@example.com',
    password: 'a long test password',
  });
  assert.equal(loginSchema.safeParse({ email: 'bad', password: 'short' }).success, false);
  assert.equal(passwordResetSchema.safeParse({
    token: 'x'.repeat(32),
    password: 'a long test password',
  }).success, true);
});
