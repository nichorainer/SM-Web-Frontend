import React, { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@chakra-ui/react';
import { getUser, isAuthenticated } from '../utils/auth';
import '../styles/admin-page.css';

/* AdminPage (offline / no API) */

const MOCK_STAFF = [
  {
    id: 'u1',
    name: 'Ayu Santoso',
    username: 'ayu.s',
    email: 'ayu@example.com',
    role: 'admin',
    avatarUrl: '',
    permissions: { products: true, orders: true, users: true, reports: true },
  },
  {
    id: 'u2',
    name: 'Budi Pratama',
    username: 'budi.p',
    email: 'budi@example.com',
    role: 'staff',
    avatarUrl: '',
    permissions: { products: true, orders: false, users: false, reports: false },
  },
  {
    id: 'u3',
    name: 'Citra Dewi',
    username: 'citra.d',
    email: 'citra@example.com',
    role: 'staff',
    avatarUrl: '',
    permissions: { products: true, orders: true, users: false, reports: false },
  },
];

const MOCK_LOGS = [
  { id: 'l1', action: 'User created', detail: 'Budi Pratama created', when: '2026-01-10 09:12' },
  { id: 'l2', action: 'Role changed', detail: 'Ayu -> admin', when: '2026-01-11 14:03' },
  { id: 'l3', action: 'Permission toggled', detail: 'Citra: orders=true', when: '2026-01-12 08:22' },
];

export default function AdminPage() {
  const currentUser = typeof isAuthenticated === 'function' && isAuthenticated() ? getUser() : null;

  const [staff, setStaff] = useState(MOCK_STAFF);
  const [q, setQ] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [logs, setLogs] = useState(MOCK_LOGS);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  // derived filtered list
  const filteredStaff = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter((s) =>
      (s.name || '').toLowerCase().includes(term) ||
      (s.username || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.role || '').toLowerCase().includes(term)
    );
  }, [q, staff]);

  useEffect(() => {
    // simulate loading briefly (no API)
    setLoadingStaff(true);
    setLoadingLogs(true);
    const t = setTimeout(() => {
      setLoadingStaff(false);
      setLoadingLogs(false);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  function handleSearch(e) {
    setQ(e.target.value);
  }

  function openEdit(id) {
    setSelectedId(id);
  }
  function closeEdit() {
    setSelectedId(null);
  }

  const selected = staff.find((s) => s.id === selectedId) || null;

  async function togglePermission(userId, key) {
    if (!selected) return;
    setSaving(true);
    // simulate network latency
    await new Promise((r) => setTimeout(r, 200));
    setStaff((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, permissions: { ...(u.permissions || {}), [key]: !u.permissions?.[key] } } : u
      )
    );
    // add log
    setLogs((prev) => [{ id: `l${Date.now()}`, action: 'Permission toggled', detail: `${selected.name}: ${key}=${!selected.permissions?.[key]}`, when: new Date().toLocaleString() }, ...prev]);
    setSaving(false);
  }

  async function changeRole(userId, newRole) {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 200));
    setStaff((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    setLogs((prev) => [{ id: `l${Date.now()}`, action: 'Role changed', detail: `${selected?.name} -> ${newRole}`, when: new Date().toLocaleString() }, ...prev]);
    setSaving(false);
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h2 className="admin-title">Admin Panel</h2>
          <p className="admin-sub">Manage staff roles, permissions, and view system audit logs</p>
        </div>

        <div className="admin-user">
          <Avatar size="sm" name={currentUser?.name} src={currentUser?.avatarUrl} />
          <div style={{ marginLeft: 8 }}>
            <div style={{ fontWeight: 600 }}>{currentUser?.name ?? '—'}</div>
            <div className="muted">{currentUser?.email ?? '—'}</div>
          </div>
        </div>
      </header>

      <div className="admin-grid">
        <section className="card staff-section">
          <div className="section-head">
            <h3>Staff Directory</h3>
            <div className="section-actions">
              <input
                className="search-input"
                placeholder="Search staff..."
                value={q}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="staff-table-wrap">
            {loadingStaff ? (
              <div className="muted">Loading staff…</div>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Permissions</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => (
                    <tr key={s.id}>
                      <td className="staff-cell">
                        <Avatar size="sm" name={s.name} src={s.avatarUrl} />
                        <div className="staff-name">{s.name}</div>
                      </td>
                      <td>{s.username}</td>
                      <td>{s.email}</td>
                      <td>{s.role}</td>
                      <td>
                        <div className="perm-list">
                          {Object.keys(s.permissions || {}).map((k) => (
                            <span key={k} className={`perm-pill ${s.permissions[k] ? 'on' : 'off'}`}>{k}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button className="btn-subtle" onClick={() => openEdit(s.id)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan="6" className="muted">No staff found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="card logs-section">
          <div className="section-head">
            <h3>Audit Logs</h3>
            <div className="section-actions">
              <button className="btn-ghost" onClick={() => setLogs(MOCK_LOGS)}>Reset</button>
            </div>
          </div>

          <div className="logs-list">
            {loadingLogs ? (
              <div className="muted">Loading logs…</div>
            ) : logs.length === 0 ? (
              <div className="muted">No logs yet</div>
            ) : (
              <ul>
                {logs.map((l) => (
                  <li key={l.id} className="log-item">
                    <div>
                      <div className="log-action">{l.action}</div>
                      <div className="log-detail muted">{l.detail}</div>
                    </div>
                    <div className="log-meta muted">{l.when}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Edit drawer */}
      {selected && (
        <div className="edit-drawer">
          <div className="drawer-card">
            <div className="drawer-head">
              <h4>Edit Staff</h4>
              <button className="btn-close" onClick={closeEdit}>×</button>
            </div>

            <div className="drawer-body">
              <div className="edit-row">
                <Avatar size="lg" name={selected.name} src={selected.avatarUrl} />
                <div style={{ marginLeft: 12 }}>
                  <div style={{ fontWeight: 700 }}>{selected.name}</div>
                  <div className="muted">@{selected.username}</div>
                  <div className="muted">{selected.email}</div>
                </div>
              </div>

              <div className="edit-form">
                <label>Role</label>
                <select
                  value={selected.role}
                  onChange={(e) => changeRole(selected.id, e.target.value)}
                >
                  <option value="staff">Staff 1</option>
                  <option value="admin">Staff 2</option>
                </select>

                <label style={{ marginTop: 12 }}>Permissions</label>
                <div className="permissions-grid">
                  {['products', 'orders', 'users', 'reports'].map((key) => (
                    <label key={key} className="perm-toggle">
                      <input
                        type="checkbox"
                        checked={!!selected.permissions?.[key]}
                        onChange={() => togglePermission(selected.id, key)}
                      />
                      <span style={{ marginLeft: 8 }}>{key}</span>
                    </label>
                  ))}
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn-ghost" onClick={closeEdit}>Close</button>
                  <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}