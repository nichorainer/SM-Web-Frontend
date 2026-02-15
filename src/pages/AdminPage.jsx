import React, { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@chakra-ui/react';
import { 
  getUser, 
  getProfile,
  readLocalAvatar, 
  onAuthEvent, 
  offAuthEvent, 
} from '../utils/auth';
import '../styles/admin-page.css';
import { form } from 'framer-motion/client';

/* AdminPage (no API) */
// Helper: Capitalize first letter, lowercase the rest
function capitalizeRole(role) {
  if (!role) return '';
  return String(role).charAt(0).toUpperCase() + String(role).slice(1).toLowerCase();
}

// Helper format date for mock logs
function formatDate(str) {
  return new Date(str).toLocaleString();
}

// Mock Data
const MOCK_STAFF = [
  {
    id: 'u1',
    name: 'Nielson',
    username: 'niel',
    email: 'nielson@example.com',
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
  { id: '001', action: 'Role changed', detail: 'Role Ayu changed into admin', when: formatDate('2026-01-11T14:03:00') },
  { id: '002', action: 'Permission toggled', detail: 'Citra edit order permission enabled', when: formatDate('2026-01-12T08:22:00') },
  { id: '003', action: 'User created', detail: 'Budi Pratama created', when: formatDate('2026-01-10T09:12:00') },
  { id: '004', action: 'User created', detail: 'Nielson created', when: formatDate('2026-01-09T11:11:00') },
];

export default function AdminPage() {
  const [staff, setStaff] = useState(MOCK_STAFF);
  const [q, setQ] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [logs, setLogs] = useState(MOCK_LOGS);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  // User Data (Admin) to display at top right page
  const [userData, setUserData] = useState(getUser() || null);
  // Prefer per-user FE avatar (if utils wrote it), then legacy 'user-avatar', then backend avatar
  const [avatarSrc, setAvatarSrc] = useState(
    // // read per-user key lazily in effect; initial fallback to legacy key or getUser()
    localStorage.getItem('user-avatar') || (getUser()?.avatarUrl || null)
  );
  
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

  // Sync initial and listen for updates — mirror Header logic
  useEffect(() => {
    let mounted = true;
    const userIdRef = { current: null }; // simple ref-like holder

    // init: read authoritative profile (localStorage or backend)
    async function init() {
      try {
        const profile = await getProfile();
        // console.log('Admin init profile:', profile);
        if (!mounted || !profile) return;

        userIdRef.current = profile.id;
        setUserData(profile);
        // prefer per-user FE avatar if present
        const local = readLocalAvatar(profile.id);
        setAvatarSrc(local || profile.avatar_url || profile.avatarUrl || null);
      } catch (err) {
        console.error('Admin getProfile error:', err);
      }
    }
    init();

    // Handler: update avatar when emitter/window event arrives
    const avatarHandler = (e) => {
      // support both shapes: { id, dataUrl } or direct dataUrl
      const detail = e?.detail ?? null;
      const id = detail && typeof detail === 'object' && 'id' in detail ? detail.id : null;
      const dataUrl = detail && typeof detail === 'object' && 'dataUrl' in detail ? detail.dataUrl : detail;
      console.log('Admin avatarHandler event:', e?.type, e?.detail);

      // If id provided, only update when it matches current user; if no id, update anyway
      if (!id || id === userIdRef.current) {
        setAvatarSrc(dataUrl || null);
      }
    };

    // Handler: update name when emitter/window event arrives
    const nameHandler = (e) => {
      const detail = e?.detail ?? null;
      const id = detail && typeof detail === 'object' && 'id' in detail ? detail.id : null;
      const fullName = detail && typeof detail === 'object' && 'fullName' in detail ? detail.fullName : detail?.full_name ?? null;
      console.log('Admin nameHandler event:', e?.type, e?.detail);
      if (!fullName) return;
      if (!id || id === userIdRef.current) {
        // update userData.full_name while preserving other fields
        setUserData((prev) => (prev ? { ...prev, full_name: fullName } : prev));
      }
    };

    // Handler: user refreshed payload
    const userRefreshedHandler = (e) => {
      const payload = e?.detail?.user ?? e?.detail ?? null;
      console.log('Admin userRefreshed event:', e?.type, e?.detail);
      if (!payload) return;
      userIdRef.current = payload.id;
      setUserData(payload);
      const local = readLocalAvatar(payload.id);
      setAvatarSrc(local || payload.avatar_url || payload.avatarUrl || null);
    };

    // Subscribe to utils emitter (if available)
    try {
      onAuthEvent?.('avatar:changed', avatarHandler);
      onAuthEvent?.('name:changed', nameHandler);
      onAuthEvent?.('user:refreshed', userRefreshedHandler);
    } catch (err) {
      console.warn('Admin emitter subscribe failed (ok if not present):', err);
    }

    // Legacy window events fallback (keeps backward compatibility)
    function onUserUpdatedWindow(e) {
      console.log('Admin window user-updated:', e?.detail);
      const updated = e?.detail ?? null;
      if (updated) {
        userIdRef.current = updated.id ?? userIdRef.current;
        setUserData(updated);
        const local = updated?.id ? readLocalAvatar(updated.id) : null;
        setAvatarSrc(local || updated.avatar_url || updated.avatarUrl || null);
      }
    }
    function onAvatarUpdatedWindow(e) {
      console.log('Admin window avatar-updated:', e?.detail);
      const val = e?.detail ?? null;
      // If event carries no id, assume it's for current user; otherwise compare in avatarHandler
      setAvatarSrc(val || null);
    }

    window.addEventListener('user-updated', onUserUpdatedWindow);
    window.addEventListener('avatar-updated', onAvatarUpdatedWindow);

    // cleanup
    return () => {
      mounted = false;
      try {
        offAuthEvent?.('avatar:changed', avatarHandler);
        offAuthEvent?.('name:changed', nameHandler);
        offAuthEvent?.('user:refreshed', userRefreshedHandler);
      } catch (err) {
        // ignore
      }
      window.removeEventListener('user-updated', onUserUpdatedWindow);
      window.removeEventListener('avatar-updated', onAvatarUpdatedWindow);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // * TO EDIT STAFF *
  useEffect(() => {
    // simulate loading briefly (no API)
    setLoadingStaff(true);
    setLoadingLogs(true);

    // load localStorage for staffData
    const stored = localStorage.getItem("staffData");
    if (stored) {
      setStaff(JSON.parse(stored));
    } else {
      setStaff(MOCK_STAFF);
    }

    // load logs from localStorage
    const storedLogs = localStorage.getItem("logsData");
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    } else {
      setLogs(MOCK_LOGS);
    }

    // timeout simulation
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

  function changePermission(userId, permKey) {
    setSaving(true);

    // Delay simulation (dummy data)
    setTimeout(() => {
      setStaff(prev => {
        const updated = prev.map(u =>
        u.id === userId
          ? {
              ...u,
              permissions: {
                ...u.permissions,
                [permKey]: !u.permissions[permKey],
              },
            }
          : u
      );

      // save changes to local storage
      localStorage.setItem("staffData", JSON.stringify(updated));

      return updated;
    });

      // Get the user
      const user = staff.find(u => u.id === userId);
      const newValue = !user.permissions[permKey];

      // Add logs
      setLogs(prev => {
        const updatedLogs = [
          {
            id: `l${Date.now()}`,
            action: 'Permission toggled',
            detail: `${user.name} ${permKey} ${newValue ? 'enabled' : 'disabled'}`,
            when: new Date().toLocaleString(),
          },
          ...prev,
        ];

      localStorage.setItem("logsData", JSON.stringify(updatedLogs));

      return updatedLogs;
    });

      setSaving(false);
    }, 200);
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h2 className="admin-title">Admin Panel</h2>
          <p className="admin-sub">Manage staff roles, permissions, and view system audit logs</p>
        </div>

        <div className="admin-user">
          <Avatar
            name={userData?.full_name || 'User'}
            src={avatarSrc || undefined}
            boxSize="40px"
          />

          <div style={{ marginLeft: 8 }} className="admin-user-info">
            <div className="admin-name">
              {userData?.full_name || 'Guest'}
            </div>
            <div className="admin-email">
              {userData?.email || null}
            </div>

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
                      <td>{capitalizeRole(s.role)}</td>
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
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>

                <label style={{ marginTop: 12 }}>Permissions</label>
                <div className="permissions-grid">
                  {['products', 'orders', 'users', 'reports'].map((key) => (
                    <label key={key} className="perm-toggle">
                      <input
                        type="checkbox"
                        checked={!!selected.permissions?.[key]}
                        onChange={() => changePermission(selected.id, key)}
                      />
                      <span style={{ marginLeft: 8 }}>{key}</span>
                    </label>
                  ))}
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn-ghost" onClick={closeEdit}>Close</button>
                  <button 
                    className="btn-primary" 
                    disabled={saving}
                    onClick={closeEdit}
                    >
                      {saving ? 'Saving...' : 'Close'}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}