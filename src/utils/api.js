import { API_URL } from './config';

// PRODUCTS

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function getProducts() {
  const res = await fetch(`${API_URL}/products`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(`Failed to fetch products: ${res.status} ${JSON.stringify(body)}`);
  }
  const body = await res.json();
  return body?.data ?? body;
}

export async function createProduct(payload) {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(`Failed to create product: ${res.status} ${JSON.stringify(body)}`);
  }
  const body = await res.json();
  return body?.data ?? body;
}

export async function updateProductStock(id, delta) {
  const res = await fetch(`${API_URL}/products/${encodeURIComponent(id)}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

// ORDERS

// Get Orders
export async function getOrders() {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(`Failed to fetch orders: ${res.status} ${JSON.stringify(body)}`);
  }
  const body = await res.json();
  return body?.data ?? body;
}

// Create Orders
export async function createOrders(payload) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(`Failed to create orders: ${res.status} ${JSON.stringify(body)}`);
  }
  const body = await res.json();
  return body?.data ?? body;
}

// For Order ID (Order Number) generation
export async function fetchNextOrderNumber() {
  const res = await fetch(`${API_URL}/orders/order-number`);
  const data = await res.json();
  return data.order_number;
}

// Update Order Status
export async function updateOrderStatus(id, status) {
  const res = await fetch(`${API_URL}/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

// Delete Order
export async function deleteOrder(id) {
  const url = `${API_URL}/orders/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete order');
  return res.json();
}

export async function fetchTopProductsFromOrders() {
  try {
    const res = await fetch(`${API_URL}/orders/top-products`);
    if (!res.ok) {
      throw new Error(`Failed to fetch top products: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Error fetching top products:", err);
    throw err;
  }
}