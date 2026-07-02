import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClient } from '../context/ClientContext';
import { getClientUsers, addClientUser, updateClientUser, removeClientUser } from '../api';
import Toast from '../components/Toast';

const C = {
  blue: '#00259C', lightBlue: '#E8EDFB',
  border: '#E2E8F0', muted: '#64748B', text: '#1E293B', red: '#DC2626',
};

// ── Account tab (all users) ───────────────────────────────────
function AccountTab() {
  const { user } = useAuth();
  const { workspaceRole } = useClient() || {};

  return (
    <div style={{ maxWidth: 480, padding: '32px 0' }}>
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: C.lightBlue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: C.blue,
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{user?.email}</div>
            <span style={{
              display: 'inline-block', marginTop: 5, fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 0.5, padding: '2px 8px',
              borderRadius: 99, background: C.lightBlue, color: C.blue,
            }}>
              {workspaceRole || user?.role}
            </span>
          </div>
        </div>
        <div style={{ marginTop: 20, padding: '14px 16px', background: '#F8FAFF', borderRadius: 8, fontSize: 12, color: C.muted }}>
          Your account is managed through Microsoft Entra ID. To change your name, photo, or password, visit{' '}
          <a href="https://myaccount.microsoft.com" target="_blank" rel="noreferrer" style={{ color: C.blue, fontWeight: 600 }}>
            myaccount.microsoft.com
          </a>.
        </div>
      </div>
    </div>
  );
}

// ── Workspace user management tab (admins only) ───────────────
function UsersTab() {
  const { user: me } = useAuth();
  const { client } = useClient() || {};
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'member' });

  function showToast(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); }

  useEffect(() => {
    if (!client?.id) return;
    getClientUsers(client.id)
      .then(setUsers)
      .catch(() => showToast('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  }, [client?.id]);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      const u = await addClientUser(client.id, form);
      setUsers(prev => {
        const exists = prev.find(x => x.id === u.id);
        return exists ? prev.map(x => x.id === u.id ? u : x) : [...prev, u];
      });
      setForm({ name: '', email: '', password: '', role: 'member' });
      setShowAdd(false);
      showToast('User added to workspace');
    } catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
  }

  async function handleRoleChange(uid, role) {
    try {
      await updateClientUser(client.id, uid, { role });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, workspace_role: role } : u));
      showToast('Role updated');
    } catch { showToast('Error updating role', 'error'); }
  }

  async function handleRemove(uid) {
    if (!window.confirm('Remove this user from the workspace?')) return;
    try {
      await removeClientUser(client.id, uid);
      setUsers(prev => prev.filter(u => u.id !== uid));
      showToast('User removed');
    } catch { showToast('Error', 'error'); }
  }

  return (
    <div style={{ padding: '28px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Workspace Members</h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
            {users.length} user{users.length !== 1 ? 's' : ''} in <strong>{client?.name}</strong>
          </p>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          style={{ padding: '8px 18px', background: C.blue, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          + Add / Invite User
        </button>
      </div>

      {/* Add form (inline) */}
      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: C.muted }}>
            Enter the email of an existing Prism user to add them, or fill all fields to invite a new user.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Full Name (new users)', key: 'name', type: 'text', placeholder: 'Jane Doe' },
              { label: 'Email *', key: 'email', type: 'email', placeholder: 'jane@woventalent.in', required: true },
              { label: 'Temp Password (new users)', key: 'password', type: 'password', placeholder: '••••••' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>{f.label}</label>
                <input
                  type={f.type} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} required={f.required}
                  style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>Workspace Role</label>
              <select
                value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}
              >
                <option value="member">Member (view only)</option>
                <option value="admin">Admin (can edit)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ padding: '8px 18px', background: C.blue, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Add to Workspace
            </button>
            <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 7, fontWeight: 600, cursor: 'pointer', background: '#fff', fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFF' }}>
                {['Name', 'Email', 'Workspace Role', 'Actions'].map(h => (
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
                      {u.id === me?.id && <span style={{ fontSize: 10, background: C.lightBlue, color: C.blue, borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>You</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: C.muted, fontSize: 13 }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={u.workspace_role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === me?.id}
                      style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', color: C.text, background: u.id === me?.id ? '#F8FAFF' : '#fff' }}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.id !== me?.id && (
                      <button onClick={() => handleRemove(u.id)} style={{ padding: '4px 12px', borderRadius: 5, border: 'none', background: '#FEF2F2', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No users yet. Add the first member.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────
export default function SettingsPage() {
  const { canEdit } = useClient() || {};
  const [activeTab, setActiveTab] = useState(canEdit ? 'users' : 'account');

  const tabs = [
    ...(canEdit ? [{ id: 'users', label: '👥  Workspace Members' }] : []),
    { id: 'account', label: '👤  My Account' },
  ];

  return (
    <div style={{ background: '#F4F7FB', minHeight: '100vh' }}>
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

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px' }}>
        {activeTab === 'users'   && canEdit   && <UsersTab />}
        {activeTab === 'account'              && <AccountTab />}
      </div>
    </div>
  );
}
