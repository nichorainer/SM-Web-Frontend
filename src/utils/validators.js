export function validateProduct({ name, stock }) {
  const errors = {};
  if (!name || name.trim() === '') errors.name = 'Product name is required';
  const s = Number(stock);
  if (Number.isNaN(s) || s < 0) errors.stock = 'Stock must be a non-negative number';
  return errors;
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}