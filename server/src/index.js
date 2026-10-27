import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import {
  assertJwtSecret,
  createResetToken,
  hashPassword,
  hashResetToken,
  issueAccessToken,
  verifyAccessToken,
  verifyPassword,
} from './auth.js';
import { pool } from './database.js';
import { isMailConfigured, sendPasswordResetEmail } from './mailer.js';
import {
  deliveryMessageSchema,
  loginSchema,
  orderSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  profileSchema,
  registerSchema,
} from './validation.js';

assertJwtSecret();

const app = express();
const port = Number(process.env.PORT) || 10000;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8081,http://localhost:19006')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    const error = new Error('This origin is not allowed by the API.');
    error.statusCode = 403;
    callback(error);
  },
}));
app.use(express.json({ limit: '100kb' }));

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Try again later.' },
});
const resetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many password recovery attempts. Try again later.' },
});
const dummyPasswordHash = await hashPassword('not-a-real-user-password');

async function requireAuth(req, res, next) {
  try {
    const claims = verifyAccessToken(req.headers.authorization);
    const result = await pool.query(
      `SELECT id::text, email, name, token_version
       FROM accounts
       WHERE id = $1`,
      [claims.sub],
    );
    const account = result.rows[0];
    if (!account || account.token_version !== claims.ver) {
      res.status(401).json({ error: 'Your session has expired. Sign in again.' });
      return;
    }
    req.auth = account;
    next();
  } catch (error) {
    if (error.statusCode === 401) {
      res.status(401).json({ error: error.message });
      return;
    }
    next(error);
  }
}

function mapOrder(row) {
  return {
    id: row.id,
    status: row.status,
    total: row.total,
    date: row.date,
    customer: { name: row.customer_name, email: row.customer_email },
    delivery: {
      name: row.delivery_name,
      phone: row.delivery_phone,
      address: row.delivery_address,
      city: row.delivery_city,
    },
    paymentMethod: row.payment_method,
    deliveryMessage: row.delivery_message,
    deliveryMessageSentAt: row.delivery_message_sent_at,
    items: row.items,
  };
}

async function loadOrders(customerSub) {
  const result = await pool.query(
    `SELECT
       o.id::text,
       o.status,
       o.total,
       o.created_at AS date,
       o.customer_name,
       o.customer_email,
       o.delivery_name,
       o.delivery_phone,
       o.delivery_address,
       o.delivery_city,
       o.payment_method,
       o.delivery_message,
       o.delivery_message_sent_at,
       COALESCE(
         json_agg(json_build_object(
           'id', oi.product_id,
           'name', oi.name,
           'category', oi.category,
           'price', oi.price,
           'rating', oi.rating,
           'emoji', oi.emoji,
           'image', oi.image,
           'color', oi.color,
           'tag', oi.tag,
           'quantity', oi.quantity
         ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL),
         '[]'::json
       ) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.customer_sub = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [customerSub],
  );
  return result.rows.map(mapOrder);
}

async function loadCustomer(req, res, next) {
  try {
    const result = await pool.query(
      `INSERT INTO customers (user_sub, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_sub) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, customers.email),
         name = CASE
           WHEN customers.name = split_part(COALESCE(customers.email, ''), '@', 1)
             THEN EXCLUDED.name
           ELSE customers.name
         END,
         updated_at = NOW()
       RETURNING user_sub, email, name, role`,
      [req.auth.id, req.auth.email, req.auth.name],
    );

    req.customer = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

app.get('/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

const authApi = express.Router();

authApi.post('/register', authRateLimit, async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Enter a name, valid email, and password with at least 8 characters.' });
    return;
  }

  const client = await pool.connect();
  let transactionStarted = false;
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    await client.query('BEGIN');
    transactionStarted = true;
    const accountResult = await client.query(
      `INSERT INTO accounts (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id::text, email, name, token_version`,
      [parsed.data.email, parsed.data.name, passwordHash],
    );
    const account = accountResult.rows[0];
    await client.query(
      `INSERT INTO customers (user_sub, email, name)
       VALUES ($1, $2, $3)`,
      [account.id, account.email, account.name],
    );
    await client.query('COMMIT');
    transactionStarted = false;
    res.status(201).json({
      token: issueAccessToken(account),
      user: { uid: account.id, email: account.email, name: account.name, role: 'customer' },
    });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    if (error.code === '23505') {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    next(error);
  } finally {
    client.release();
  }
});

authApi.post('/login', authRateLimit, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Enter a valid email and password.' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id::text, email, name, password_hash, token_version
       FROM accounts
       WHERE LOWER(email) = $1`,
      [parsed.data.email],
    );
    const account = result.rows[0];
    const passwordMatches = await verifyPassword(
      parsed.data.password,
      account?.password_hash || dummyPasswordHash,
    );
    if (!account || !passwordMatches) {
      res.status(401).json({ error: 'Email or password is incorrect.' });
      return;
    }

    res.json({
      token: issueAccessToken(account),
      user: { uid: account.id, email: account.email, name: account.name, role: 'customer' },
    });
  } catch (error) {
    next(error);
  }
});

authApi.post('/password-reset/request', resetRateLimit, async (req, res, next) => {
  const parsed = passwordResetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }
  if (!isMailConfigured()) {
    res.status(503).json({ error: 'Password recovery is not configured. Contact the store for help.' });
    return;
  }

  try {
    const accountResult = await pool.query(
      'SELECT id::text, email FROM accounts WHERE LOWER(email) = $1',
      [parsed.data.email],
    );
    const account = accountResult.rows[0];
    if (account) {
      await pool.query('DELETE FROM password_reset_tokens WHERE expires_at <= NOW() OR used_at IS NOT NULL');
      const token = createResetToken();
      const tokenHash = hashResetToken(token);
      await pool.query(
        `INSERT INTO password_reset_tokens (token_hash, account_id, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
        [tokenHash, account.id],
      );
      try {
        await sendPasswordResetEmail(account.email, token);
      } catch (error) {
        await pool.query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]);
        throw error;
      }
    }
    res.status(202).json({
      message: 'If an account exists for this email, a password reset link will arrive shortly.',
    });
  } catch (error) {
    next(error);
  }
});

authApi.post('/password-reset/complete', resetRateLimit, async (req, res, next) => {
  const parsed = passwordResetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'The reset link or new password is invalid.' });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const tokenHash = hashResetToken(parsed.data.token);
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query('BEGIN');
    transactionStarted = true;
    const tokenResult = await client.query(
      `SELECT account_id
       FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [tokenHash],
    );
    const resetToken = tokenResult.rows[0];
    if (!resetToken) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
      return;
    }

    await client.query(
      `UPDATE accounts
       SET password_hash = $1, token_version = token_version + 1, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, resetToken.account_id],
    );
    await client.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1',
      [tokenHash],
    );
    await client.query('COMMIT');
    transactionStarted = false;
    res.json({ message: 'Your password has been reset. You can now sign in.' });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

app.use('/api/auth', authApi);

app.get('/api/products', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, category, price, rating, emoji, image, color, tag
       FROM products
       WHERE is_active = TRUE
       ORDER BY sort_order, id`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

const customerApi = express.Router();
customerApi.use(requireAuth, loadCustomer);

customerApi.get('/me', (req, res) => {
  const customer = req.customer;
  res.json({
    uid: customer.user_sub,
    email: customer.email,
    name: customer.name,
    role: customer.role,
  });
});

customerApi.put('/me', async (req, res, next) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Profile details are invalid.' });
    return;
  }

  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query('BEGIN');
    transactionStarted = true;
    const accountResult = await client.query(
      `UPDATE accounts
       SET name = $1, email = COALESCE($2, email), updated_at = NOW()
       WHERE id = $3
       RETURNING id::text, email, name`,
      [parsed.data.name, parsed.data.email || null, req.customer.user_sub],
    );
    const account = accountResult.rows[0];
    const customerResult = await client.query(
      `UPDATE customers
       SET name = $1, email = $2, updated_at = NOW()
       WHERE user_sub = $3
       RETURNING user_sub, email, name, role`,
      [account.name, account.email, req.customer.user_sub],
    );
    await client.query('COMMIT');
    transactionStarted = false;
    const customer = customerResult.rows[0];
    res.json({
      uid: customer.user_sub,
      email: customer.email,
      name: customer.name,
      role: customer.role,
    });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

customerApi.get('/orders', async (req, res, next) => {
  try {
    res.json(await loadOrders(req.customer.user_sub));
  } catch (error) {
    next(error);
  }
});

customerApi.post('/orders', async (req, res, next) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Order details are invalid.', details: parsed.error.flatten() });
    return;
  }

  const requestedQuantities = new Map();
  for (const item of parsed.data.items) {
    const quantity = (requestedQuantities.get(item.productId) || 0) + item.quantity;
    if (quantity > 99) {
      res.status(400).json({ error: 'A product quantity cannot exceed 99.' });
      return;
    }
    requestedQuantities.set(item.productId, quantity);
  }

  const client = await pool.connect();
  let transactionStarted = false;
  try {
    const productsResult = await client.query(
      `SELECT id, name, category, price, rating, emoji, image, color, tag
       FROM products
       WHERE id = ANY($1::text[]) AND is_active = TRUE`,
      [[...requestedQuantities.keys()]],
    );
    if (productsResult.rows.length !== requestedQuantities.size) {
      res.status(400).json({ error: 'One or more products are no longer available.' });
      return;
    }

    const items = productsResult.rows.map((product) => ({
      ...product,
      quantity: requestedQuantities.get(product.id),
    }));
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0) + 2000;
    const customer = req.customer;

    await client.query('BEGIN');
    transactionStarted = true;
    const orderResult = await client.query(
      `INSERT INTO orders (
         customer_sub, total, customer_name, customer_email, delivery_name,
         delivery_phone, delivery_address, delivery_city, payment_method
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id::text, created_at`,
      [
        customer.user_sub,
        total,
        parsed.data.delivery.name,
        parsed.data.delivery.email,
        parsed.data.delivery.name,
        parsed.data.delivery.phone,
        parsed.data.delivery.address,
        parsed.data.delivery.city,
        parsed.data.paymentMethod,
      ],
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (
           order_id, product_id, name, category, price, rating, emoji, image, color, tag, quantity
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          orderId,
          item.id,
          item.name,
          item.category,
          item.price,
          item.rating,
          item.emoji,
          item.image,
          item.color,
          item.tag,
          item.quantity,
        ],
      );
    }
    await client.query('COMMIT');
    transactionStarted = false;

    res.status(201).json({
      id: orderId,
      status: 'Processing',
      total,
      date: orderResult.rows[0].created_at,
      customer: {
        name: parsed.data.delivery.name,
        email: parsed.data.delivery.email,
      },
      delivery: parsed.data.delivery,
      paymentMethod: parsed.data.paymentMethod,
      deliveryMessage: null,
      deliveryMessageSentAt: null,
      items,
    });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

customerApi.patch('/orders/:id/delivery-message', async (req, res, next) => {
  const parsed = deliveryMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Enter a delivery message before saving.' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE orders
       SET delivery_message = $1, delivery_message_sent_at = NOW()
       WHERE id = $2 AND customer_sub = $3 AND status = 'Delivered'
       RETURNING id::text, delivery_message, delivery_message_sent_at`,
      [parsed.data.message, req.params.id, req.customer.user_sub],
    );
    if (!result.rowCount) {
      const order = await pool.query(
        'SELECT status FROM orders WHERE id = $1 AND customer_sub = $2',
        [req.params.id, req.customer.user_sub],
      );
      if (!order.rowCount) {
        res.status(404).json({ error: 'Order not found.' });
      } else {
        res.status(409).json({ error: 'A delivery message can only be saved after delivery.' });
      }
      return;
    }
    res.json({
      id: result.rows[0].id,
      deliveryMessage: result.rows[0].delivery_message,
      deliveryMessageSentAt: result.rows[0].delivery_message_sent_at,
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api', customerApi);
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = Number(error.status || error.statusCode) || 500;
  if (status >= 500) console.error('API request failed:', error);
  res.status(status).json({
    error: status >= 500 ? 'The API could not complete the request.' : error.message,
  });
});

try {
  await pool.query('SELECT 1');
  app.listen(port, () => {
    console.log(`D&G API listening on port ${port}.`);
  });
} catch (error) {
  console.error('The API could not start because the database is unavailable:', error);
  await pool.end();
  process.exitCode = 1;
}
