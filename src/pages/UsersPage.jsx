import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button } from '@chakra-ui/react';
import { 
  getUser, 
  getProfile,
  readLocalAvatar, 
  onAuthEvent, 
  offAuthEvent,
  fetchUsers,
  updateRole,
  updatePermissions
} from '../utils/auth';
import '../styles/users-page.css';

// Helper: Capitalize first letter, lowercase the rest
function capitalizeRole(role) {
  if (!role) return '';
  return String(role).charAt(0).toUpperCase() + String(role).slice(1).toLowerCase();
}

export default function UsersPage() {
  const [user, setUser] = useState([]);
  const [q, setQ] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [logs, setLogs] = useState([]);
  const [loadingLogs] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  // User Data (Admin) to display at top right page
  const [userData, setUserData] = useState(getUser() || null);
  // Prefer per-user FE avatar (if utils wrote it), then legacy 'user-avatar', then backend avatar
  const [avatarSrc, setAvatarSrc] = useState(
    // // read per-user key lazily in effect; initial fallback to legacy key or getUser()
    localStorage.getItem('user-avatar') || (getUser()?.avatarUrl || null)
  );

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
  }, []);

  // derived filtered list
  const filteredUser = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return user;
    return user.filter((s) =>
      (s.name || '').toLowerCase().includes(term) ||
      (s.username || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.role || '').toLowerCase().includes(term)
    );
  }, [q, user]);

  // * TO EDIT USERS *
  useEffect(() => {
    setLoadingUsers(true);

    async function loadUsers() {
      try {
        const json = await fetchUsers();
        setUser(json.data || []);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoadingUsers(false);
      }
    }

    // load logs from localStorage
    const savedLogs = localStorage.getItem("user-logs");
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }

    loadUsers();
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

  const selected = user.find((s) => s.id === selectedId) || null;

  // Change user permissions
  async function changePermission(userId, permKey) {
    setSaving(true);
    try {
      const targetUser = user.find(u => u.id === userId);
      // safety check
      if (!targetUser || !targetUser.permissions) {
        setSaving(false);
        return;
      }

      const newValue = !targetUser.permissions[permKey];
      const payload = {
        user_id: userId,
        permissions: {
          ...targetUser.permissions,
          [permKey]: newValue,
        },
      };

      // call API update
      await updatePermissions(payload);

      // update local state after success
      setUser(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, permissions: { ...u.permissions, [permKey]: newValue } }
            : u
        )
      );

      // update logs UI
      setLogs(prev => {
        const newLogs = [
          {
            id: `l${Date.now()}`,
            action: "Permission toggled",
            detail: `${targetUser.full_name || targetUser.username} -> ${permKey} ${newValue ? "enabled" : "disabled"}`,
            when: new Date().toLocaleString(),
          },
          ...prev,
        ];
        localStorage.setItem("user-logs", JSON.stringify(newLogs));
        return newLogs;
      });
    } catch (err) {
      console.error("Failed to update permission:", err);
    } finally {
      setSaving(false);
    }
  }

  // Update user role
  async function changeRole(userId, newRole) {
    setSaving(true);
    try {
      const targetUser = user.find(u => u.id === userId);
      if (!targetUser) {
        setSaving(false);
        return;
      }

      const payload = {
        id: userId,
        role: newRole,
      };

      // call BE
      await updateRole(payload);

      // update local state
      setUser(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );

      // update logs
      setLogs(prev => {
        const newLogs = [
          {
            id: `l${Date.now()}`,
            action: "Role updated",
            detail: `${targetUser.full_name || targetUser.username} -> ${newRole}`,
            when: new Date().toLocaleString(),
          },
          ...prev,
        ];
        localStorage.setItem("user-logs", JSON.stringify(newLogs));
        return newLogs;
      });
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h2 className="admin-title">Edit User Permissions</h2>
          <p className="admin-sub">Manage other user roles, permissions, and view system audit logs</p>
        </div>

        <div className="admin-user">
          <Avatar
            name={userData?.full_name || 'User'}
            src={avatarSrc || undefined}
            size="md"
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
        <section className="card user-section">
          <div className="section-head-user">
            <h3>User Directory</h3>
            <div className="section-actions">
              <input
                className="search-input"
                placeholder="Search users..."
                value={q}
                onChange={handleSearch}
              />
              <Button
                className="btn-subtle"
                onClick={() => setQ("")}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="user-table-wrap">
            {loadingUsers ? (
              <div className="muted">Loading users...</div>
            ) : (
              <table className="user-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Permissions</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUser.map((s) => (
                    <tr key={s.id}>
                      <td className="user-cell">
                        <Avatar
                          size="sm"
                          name={s.full_name}
                          src={s.avatarUrl}
                        />
                        <div className="user-name">{s.full_name}</div>
                      </td>
                      <td>{s.username}</td>
                      <td>{s.email}</td>
                      <td>{capitalizeRole(s.role)}</td>
                      <td>
                        <div className="perm-list">
                          {['orders', 'products', 'users'].map((k) => (
                            <span
                              key={k}
                              className={`perm-pill ${s.permissions?.[k] ? 'on' : 'off'}`}
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button className="btn-subtle" onClick={() => openEdit(s.id)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                  {filteredUser.length === 0 && (
                    <tr>
                      <td colSpan="6" className="muted">No users found</td>
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
          </div>

          <div className="logs-list">
            {loadingLogs ? (
              <div className="muted">Loading logs…</div>
            ) : logs.length === 0 ? (
              <div className="muted">No logs yet</div>
            ) : (
              <ul>
                {logs.map((l) => {
                  const targetUser = filteredUser.find(u => u.id === l.user_id);
                  return (
                    <li key={l.id} className="log-item">
                      <div>
                        <div className="log-action">{l.action}</div>
                        <div className="log-detail muted">
                          {l.detail}
                        </div>
                      </div>
                      <div className="log-meta muted">{l.when}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="table-actions">
            <Button
              className="btn-subtle"
              onClick={() => {
                setLogs([]);
                localStorage.removeItem("user-logs");
              }}
            >
              Clear Logs
            </Button>
          </div>
        </section>
      </div>

      {/* Edit drawer */}
      {selected && (
        <div className="edit-drawer">
          <div className="drawer-card">
            <div className="drawer-head">
              <h4>Edit User</h4>
            </div>

            <div className="drawer-body">
              <div className="edit-row">
                <Avatar size="lg" name={selected.full_name} src={selected.avatarUrl} />
                <div style={{ marginLeft: 12 }}>
                  <div style={{ fontWeight: 700 }}>{selected.full_name}</div>
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
                  {['products', 'orders', 'users'].map((key) => (
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
                  <Button
                    className="btn-ghost" 
                    onClick={closeEdit}
                  >
                    Close
                  </Button>
                  <Button 
                    className="btn-primary" 
                    disabled={saving}
                    onClick={closeEdit}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}