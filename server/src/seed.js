import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './database.js';

const productsPath = fileURLToPath(new URL('./data/products.json', import.meta.url));

try {
  const products = JSON.parse(await readFile(productsPath, 'utf8'));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    for (const [index, product] of products.entries()) {
      await client.query(
        `INSERT INTO products
          (id, name, category, price, rating, emoji, image, color, tag, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           price = EXCLUDED.price,
           rating = EXCLUDED.rating,
           emoji = EXCLUDED.emoji,
           image = EXCLUDED.image,
           color = EXCLUDED.color,
           tag = EXCLUDED.tag,
           sort_order = EXCLUDED.sort_order,
           is_active = TRUE,
           updated_at = NOW()`,
        [
          product.id,
          product.name,
          product.category,
          product.price,
          product.rating,
          product.emoji,
          product.image,
          product.color,
          product.tag,
          index,
        ],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  console.log(`Seeded ${products.length} products.`);
} finally {
  await pool.end();
}
