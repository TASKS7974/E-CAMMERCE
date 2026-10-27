import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { deliveryMessageSchema, orderSchema, profileSchema } from '../src/validation.js';

const validOrder = {
  items: [{ productId: 'p1', quantity: 2 }],
  delivery: {
    name: 'Customer Example',
    email: 'customer@example.com',
    phone: '+250700000000',
    address: 'KG 1 Avenue',
    city: 'Kigali',
  },
  paymentMethod: 'Cash on delivery',
};

test('accepts a valid order and normalizes delivery text', () => {
  const parsed = orderSchema.parse({
    ...validOrder,
    delivery: { ...validOrder.delivery, name: ' Customer Example ' },
  });
  assert.equal(parsed.delivery.name, 'Customer Example');
  assert.equal(parsed.items[0].quantity, 2);
});

test('rejects invalid quantities, payment methods, and extra client-supplied fields', () => {
  assert.equal(orderSchema.safeParse({
    ...validOrder,
    items: [{ productId: 'p1', quantity: 0 }],
  }).success, false);
  assert.equal(orderSchema.safeParse({
    ...validOrder,
    paymentMethod: 'Card',
  }).success, false);
  assert.equal(orderSchema.safeParse({
    ...validOrder,
    total: 1,
  }).success, false);
});

test('requires a non-empty bounded delivery message', () => {
  assert.equal(deliveryMessageSchema.safeParse({ message: '  arrived safely  ' }).data.message, 'arrived safely');
  assert.equal(deliveryMessageSchema.safeParse({ message: '   ' }).success, false);
  assert.equal(deliveryMessageSchema.safeParse({ message: 'x'.repeat(2001) }).success, false);
});

test('validates customer profile fields', () => {
  assert.deepEqual(profileSchema.parse({ name: 'Customer Example' }), { name: 'Customer Example' });
  assert.equal(profileSchema.safeParse({ name: '', email: 'bad-email' }).success, false);
});

test('catalog seed contains 50 unique priced products', async () => {
  const productsPath = new URL('../src/data/products.json', import.meta.url);
  const products = JSON.parse(await readFile(productsPath, 'utf8'));
  assert.equal(products.length, 50);
  assert.equal(new Set(products.map((product) => product.id)).size, 50);
  assert.ok(products.every((product) => Number.isInteger(product.price) && product.price > 0));
});
