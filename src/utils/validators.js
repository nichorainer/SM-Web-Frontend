// Validasi Order Fields

export function validateOrderPayload(o) {
  // required fields: order_number/orderId, customer_name/customer, platform, destination, total_amount (>0), status,
  if (!o) return { ok: false, reason: 'missing order' };

  const orderNumber = o.order_number ?? o.orderId ?? o.orderNumber ?? o.id;
  const customer = o.customer_name ?? o.customerName ?? o.customer;
  const platform = o.platform;
  const destination = o.destination;
  const total_amount = o.total_amount;
  const status = o.status;

  if (!orderNumber || String(orderNumber).trim() === '') return { ok: false, reason: 'order number is required' };
  if (!customer || String(customer).trim() === '') return { ok: false, reason: 'customer is required' };
  if (!platform || String(platform).trim() === '') return { ok: false, reason: 'platform is required' };
  if (!destination || String(destination).trim() === '') return { ok: false, reason: 'destination is required' };
  if (total_amount == null || Number(total_amount) <= 0 || Number.isNaN(Number(total_amount))) return { ok: false, reason: 'total_amount must be a positive number' };
  if (!status || String(status).trim() === '') return { ok: false, reason: 'status is required' };

  return { ok: true };
}

// utils/validators.js  (atau di atas ProductsPage.jsx)
export function validateProductPayload(payload) {
  const errors = {};

  if (!payload.name || String(payload.name).trim() === '') {
    errors.name = 'Product name is required';
  }
  if (!payload.productId || String(payload.productId).trim() === '') {
    errors.productId = 'Product ID is required';
  }
  if (!payload.supplierName || String(payload.supplierName).trim() === '') {
    errors.supplierName = 'Supplier name is required';
  }
  if (!payload.category || String(payload.category).trim() === '') {
    errors.category = 'Category is required';
  }
  if (payload.price == null || Number.isNaN(Number(payload.price)) || Number(payload.price) < 0) {
    errors.price = 'Price must be a non-negative number';
  }
  if (payload.stock == null || Number.isNaN(Number(payload.stock)) || Number(payload.stock) < 0) {
    errors.stock = 'Stock must be a non-negative integer';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}