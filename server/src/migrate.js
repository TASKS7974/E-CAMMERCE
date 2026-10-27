import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './database.js';

const schemaPath = fileURLToPath(new URL('../schema.sql', import.meta.url));

try {
  const schema = await readFile(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('Database schema is ready.');
} finally {
  await pool.end();
}
