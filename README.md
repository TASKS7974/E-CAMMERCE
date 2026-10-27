# D&G e-commerce app

A mobile-first shopping app built with Expo SDK 58, React Native, and Expo Router. The app uses email/password accounts managed by its Express API; account credentials, products, profiles, and orders are stored in Neon Postgres.

Passwords are hashed with scrypt on the server. The API signs expiring access tokens; native apps store them with Expo SecureStore. Password recovery sends a single-use, time-limited link through SMTP when mail settings are configured. Checkout payment methods remain demos; no payment is processed.

## Run locally

1. Rotate the Neon database password that was shared during setup. Copy `server/.env.example` to `server/.env`, then set the rotated `DATABASE_URL` and a new random `JWT_SECRET`. Keep this file private and server-side.

   Generate a JWT secret in PowerShell:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

2. Set `PORT=10000` in `server/.env`. Configure `CORS_ORIGINS=http://localhost:8081` if using Expo Web. Password recovery is optional for local login testing; it requires SMTP settings and `PASSWORD_RESET_URL` in the server environment.
3. Install and initialize the API:

   ```powershell
   cd server
   npm install
   npm run migrate
   npm run seed
   npm start
   ```

   The API listens on `http://localhost:10000`. `npm run migrate` creates or updates the Neon schema. `npm run seed` inserts the sample catalog.
4. In a separate terminal, from the project root, copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL` to `http://localhost:10000` for web, `http://10.0.2.2:10000` for the Android emulator, or your computer's LAN IP for a physical phone.
5. Start Expo:

   ```powershell
   npm install
   npm run start
   ```

   Choose Web for a quick UI/API test. Native sessions use Expo SecureStore.

## Deploy

1. Deploy the API to Render using the included `render.yaml` Blueprint.
2. Set Render's `DATABASE_URL` and a unique, random `JWT_SECRET` as secrets. Set `CORS_ORIGINS` to the exact web app origin if calling the API from a browser; native requests do not need a browser origin.
3. Set the app's `EXPO_PUBLIC_API_URL` to the deployed Render service URL and restart/rebuild the app.
4. To enable password recovery, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and `PASSWORD_RESET_URL` on Render. For native deep links, use `dgshop://auth/reset-password`; for web, use the deployed app's `/auth/reset-password` URL.

Never put `DATABASE_URL`, `JWT_SECRET`, or SMTP credentials in the Expo app or any `EXPO_PUBLIC_` variable. The app environment contains only the API base URL. Web stores its session in browser local storage; native apps use SecureStore.

## Account and data behavior

- Customers register and sign in with email/password through the Render API.
- Passwords are never stored in plaintext. Password reset tokens are stored hashed, expire after 30 minutes, and can only be used once.
- Access tokens expire after seven days. Resetting a password invalidates existing sessions.
- Email recovery is unavailable until SMTP is configured. Email verification is not implemented; do not open registration to the public until verification has been added.
- Existing Firebase accounts were not migrated. Earlier Auth0 customer records are not converted into password accounts; the schema migration preserves existing order rows, but those accounts need a separate migration if they contain data to retain.
- The API validates server-issued access tokens, scopes orders to the signed-in account, and calculates order totals from current database prices.
- Order status changes are managed outside the customer API. Payment methods are demo selections only.

## Project layout

- `src/app/` — Expo Router screens
- `src/components/` — shared app components and forms
- `src/store/StoreProvider.js` — app state, session, and API-backed data
- `src/lib/api.js` — app-to-Render API requests
- `src/lib/session.js` — secure session-token storage
- `server/src/index.js` — API routes and authentication
- `server/src/auth.js` — password hashing and signed access tokens
- `server/schema.sql` — Neon database schema
- `server/src/data/products.json` — initial catalog seed
- `render.yaml` — Render web service Blueprint

Product photos load from Pexels and require an internet connection.

## Validation

Run `npm run lint` for the Expo app and `npm test` from `server` for API tests. This project uses JavaScript and does not include a TypeScript type-check step.
