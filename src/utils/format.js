export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleString();
}

export function formatCurrency(value, locale = 'id-ID', currency = 'IDR') {
  if (value == null) return '';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}