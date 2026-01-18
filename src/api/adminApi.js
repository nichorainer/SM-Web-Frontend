import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://api.example.com'; // ganti sesuai backend
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // jika butuh cookie auth
});

/**
 * Staff endpoints
 */

/**
 * Get staff list with optional pagination and search
 * @param {Object} params { page, limit, q }
 * @returns {Promise<{data: Array, meta: Object}>}
 */
export async function getAllStaff({ page = 1, limit = 50, q = '' } = {}) {
  const res = await client.get('/admin/users', { params: { page, limit, q, role: 'staff' } });
  // expected response: { data: [...users], meta: { total, page, limit } }
  return res.data;
}

/**
 * Get single user profile by id
 * @param {string} id
 */
export async function getUserById(id) {
  const res = await client.get(`/users/${id}`);
  return res.data;
}

/**
 * Update user role and/or permissions
 * payload: { role?: 'staff'|'admin', permissions?: { products: boolean, orders: boolean, ... } }
 */
export async function updateUserRoleAndPermissions(id, payload) {
  const res = await client.patch(`/admin/users/${id}`, payload);
  return res.data;
}

/**
 * Create new staff (optional)
 */
export async function createStaff(payload) {
  const res = await client.post('/admin/users', payload);
  return res.data;
}

/**
 * Delete staff (optional)
 */
export async function deleteStaff(id) {
  const res = await client.delete(`/admin/users/${id}`);
  return res.data;
}

/**
 * Audit logs endpoints
 */

/**
 * Get audit logs with optional filters
 * @param {Object} params { page, limit, q, actor, action, from, to }
 */
export async function getAuditLogs({ page = 1, limit = 50, q = '', actor, action, from, to } = {}) {
  const res = await client.get('/admin/audit-logs', { params: { page, limit, q, actor, action, from, to } });
  // expected: { data: [...logs], meta: { total, page, limit } }
  return res.data;
}

/**
 * Export logs (optional) - returns file URL or blob
 */
export async function exportAuditLogs(params = {}) {
  const res = await client.get('/admin/audit-logs/export', { params, responseType: 'blob' });
  return res.data;
}

export default {
  getAllStaff,
  getUserById,
  updateUserRoleAndPermissions,
  createStaff,
  deleteStaff,
  getAuditLogs,
  exportAuditLogs,
};