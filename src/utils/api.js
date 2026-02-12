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
  const url = `http://localhost:8080/products`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(`Failed to fetch products: ${res.status} ${JSON.stringify(body)}`);
  }
  const body = await res.json();
  return body?.data ?? body;
}

export async function createProduct(payload) {
  const url = `http://localhost:8080/products`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(`Failed to create product: ${res.status} ${JSON.stringify(body)}`);
  }
  const body = await res.json();
  return body?.data ?? body;
}

// ORDERS

// Get Orders
export async function getOrders() {
  const url = `http://localhost:8080/orders`;
  const res = await fetch(url, {
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
  const url = `http://localhost:8080/orders`;
  const res = await fetch(url, {
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
  const res = await fetch(`http://localhost:8080/orders/order-number`);
  const data = await res.json();
  return data.order_number;
}

// Update Order Status
export async function updateOrderStatus(id, status) {
  const url = `http://localhost:8080/orders/${id}/status`;
  const res = await fetch(url, {
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
  const url = `http://localhost:8080/orders/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete order');
  return res.json();
}
