const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

export const apiConfigured = Boolean(apiBaseUrl);

export function getApiErrorMessage(error) {
  return error instanceof Error && error.message
    ? error.message
    : 'The request could not be completed. Try again.';
}

async function request(path, { token, method = 'GET', body } = {}) {
  if (!apiBaseUrl) {
    throw new Error('The Render API URL is missing. Configure EXPO_PUBLIC_API_URL and restart Expo.');
  }

  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.error || `API request failed (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }
  if (!payload) {
    throw new Error('The API returned an invalid response.');
  }
  return payload;
}

export function getProducts() {
  return request('/api/products');
}

export function registerAccount(details) {
  return request('/api/auth/register', { method: 'POST', body: details });
}

export function loginAccount(credentials) {
  return request('/api/auth/login', { method: 'POST', body: credentials });
}

export function requestPasswordReset(email) {
  return request('/api/auth/password-reset/request', {
    method: 'POST',
    body: { email },
  });
}

export function completePasswordReset(token, password) {
  return request('/api/auth/password-reset/complete', {
    method: 'POST',
    body: { token, password },
  });
}

export function getCustomerProfile(token) {
  return request('/api/me', { token });
}

export function updateCustomerProfile(token, profile) {
  return request('/api/me', {
    token,
    method: 'PUT',
    body: profile,
  });
}

export function getCustomerOrders(token) {
  return request('/api/orders', { token });
}

export function createCustomerOrder(token, items, details) {
  return request('/api/orders', {
    token,
    method: 'POST',
    body: {
      items: items.map(({ id, quantity }) => ({ productId: id, quantity })),
      delivery: {
        name: details.name,
        email: details.email,
        phone: details.phone,
        address: details.address,
        city: details.city,
      },
      paymentMethod: details.paymentMethod,
    },
  });
}

export function saveCustomerDeliveryMessage(token, orderId, message) {
  return request(`/api/orders/${encodeURIComponent(orderId)}/delivery-message`, {
    token,
    method: 'PATCH',
    body: { message },
  });
}
