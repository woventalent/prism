import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser, changePassword } from '../api';
import Toast from '../components/Toast';

const C = {
  blue: '#00259C', lightBlue: '#E8EDFB',
  border: '#E2E8F0', muted: '#64748B', text: '#1E293B',
  red: '#DC2626',
};

// ── Account / Change-password tab (all roles) ─────────────────
function AccountTab() {
  const { user } = useAuth();
  const [form, setForm]   = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [toast, setToast] = useState(null);
  const [busy, setBusy]   = useState(false);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  async function handleChange(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirm)
      return showToast('New passwords do not match', 'error');
    if (form.newPassword.length < 6)
      return showToast('New password must be at least 6 characters', 'error');
    setBusy(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      showToast('Password updated successfully');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update password', 'error');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 480, padding: '32px 0' }}>
      {/* Profile card */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.lightBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: C.blue }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{user?.email}</div>
            <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '2px 8px', borderRadius: 99, background: C.lightBlue, color: C.blue }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 28px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: C.text }}>Change Password</h3>
        <form onSubmit={handleChange}>
          {[
            { label: 'Current Password', key: 'currentPassword' },
            { label: 'New Password',     key: 'newPassword' },
            { label: 'Confirm New Password', key: 'confirm' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{f.label}</label>
              <input
                type="password"
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                required
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={busy}
            style={{ padding: '10px 24px', background: busy ? '#93A8DC' : C.blue, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 4 }}
          >
            {busy ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ── User management tab (admin only) ─────────────────────────
function UsersTab() {
  const { user: me } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'recruiter' });

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => showToast('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  }, []);

  function openAdd()  { setForm({ name: '', email: '', password: '', role: 'recruiter' }); setEditing(null); setShowAdd(true); }
  function openEdit(u){ setForm({ name: u.name, email: u.email, password: '', role: u.role }); setEditing(u); setShowAdd(true); }

  async function handleSave() {
    try {
      if (editing) {
        const body = { name: form.name, email: form.email, role: form.role };
        if (form.password) body.password = form.password;
        const updated = await updateUser(editing.id, body);
        setUsers(prev => prev.map(u => u.id === editing.id ? updated : u));
        showToast('User updated');
      } else {
        const created = await createUser(form);
        setUsers(prev => [...prev, created]);
        showToast('User created');
      }
      setShowAdd(false);
    } catch (err) {
      showToast(err.response?.data?.error || 'Error saving user', 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('User deleted');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error deleting user', 'error');
    }
  }

  const roleBadge = { admin: C.blue, recruiter: '#b45309', viewer: '#555' };
  const roleBg    = { admin: C.lightBlue, recruiter: '#fef3c7', viewer: '#f0ede0' };

  return (
    <div style={{ padding: '28px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Team Members</h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>{users.length} user{users.length !== 1 ? 's' : ''} in the system</p>
        </div>
        <button
          onClick={openAdd}
          style={{ padding: '8px 18px', background: C.blue, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          + Add User
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFF' }}>
                {['Name', 'Email', 'Role', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, ri) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, background: ri % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, color: C.text }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.lightBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: C.blue, flexShrink: 0 }}>
                        {u.name[0]?.toUpperCase()}
                      </div>
                      {u.name}
                      {u.id === me?.id && <span style={{ fontSize: 10, background: '#E8EDFB', color: C.blue, borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>You</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: C.muted, fontSize: 13 }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: roleBg[u.role], color: roleBadge[u.role], padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#999', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(u)} style={{ padding: '4px 12px', borderRadius: 5, border: `1px solid ${C.border}`, background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: C.blue }}>Edit</button>
                      {u.id !== me?.id && (
                        <button onClick={() => handleDelete(u.id)} style={{ padding: '4px 12px', borderRadius: 5, border: 'none', background: '#FEF2F2', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 32, width: 440, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.blue, marginTop: 0, marginBottom: 20 }}>
              {editing ? 'Edit User' : 'Add New User'}
            </h3>
            {[
              { label: 'Full Name',  key: 'name',     type: 'text',     placeholder: 'Jane Doe' },
              { label: 'Email',      key: 'email',    type: 'email',    placeholder: 'jane@org.com' },
              { label: editing ? 'New Password (leave blank to keep)' : 'Password', key: 'password', type: 'password', placeholder: '••••••' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Role</label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="admin">Admin</option>
                <option value="recruiter">Recruiter</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSave}
                style={{ flex: 1, padding: '10px', background: C.blue, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                {editing ? 'Save Changes' : 'Create User'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────
export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'users' : 'account');

  const tabs = [
    ...(isAdmin ? [{ id: 'users',   label: '👥  User Management' }] : []),
    { id: 'account', label: '🔐  Account & Password' },
  ];

  return (
    <div style={{ background: '#F4F7FB', minHeight: '100vh' }}>
      {/* sub-nav */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 32px' }}>
        <nav style={{ display: 'flex', gap: 2 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? C.blue : C.muted,
                borderBottom: activeTab === tab.id ? `2.5px solid ${C.blue}` : '2.5px solid transparent',
                fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px' }}>
        {activeTab === 'users'   && isAdmin && <UsersTab />}
        {activeTab === 'account' && <AccountTab />}
      </div>
    </div>
  );
}
