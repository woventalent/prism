import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getClients, createClient, updateClient, deleteClient,
  getClientUsers, addClientUser, updateClientUser, removeClientUser,
} from '../api';
import Toast from '../components/Toast';

const C = { blue: '#00259C', lightBlue: '#E8EDFB', border: '#E2E8F0', muted: '#64748B', text: '#1E293B', red: '#DC2626' };
const btn = (color, bg, border) => ({
  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  border: `1px solid ${border || color}`, color, background: bg || 'transparent', fontFamily: 'inherit',
});

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// ── Client Card ───────────────────────────────────────────────
function ClientCard({ client, onEdit, onManage, onDelete, onEnter }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ background: C.blue, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{client.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>/{client.slug}</div>
        </div>
        <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
          {client.member_count ?? '—'} users
        </span>
      </div>
      <div style={{ padding: '14px 18px' }}>
        {client.description
          ? <p style={{ margin: '0 0 12px', fontSize: 12, color: C.muted }}>{client.description}</p>
          : <p style={{ margin: '0 0 12px', fontSize: 12, color: '#CBD5E1', fontStyle: 'italic' }}>No description</p>
        }
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={() => onManage(client)}>Manage Users</button>
          <button style={btn(C.muted, '#fff', C.border)} onClick={() => onEdit(client)}>Edit</button>
          <button style={btn(C.muted, '#fff', C.border)} onClick={() => onEnter(client)}>Enter →</button>
          <button style={{ ...btn(C.red, '#FEF2F2', '#FCA5A5'), marginLeft: 'auto' }} onClick={() => onDelete(client)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Client Modal ─────────────────────────────────────────
function EditClientModal({ client, onSave, onClose }) {
  const [form, setForm] = useState({ name: client.name, slug: client.slug, description: client.description || '' });

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(client.id, form);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: 32, width: 480, boxShadow: '0 12px 48px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: C.blue }}>Edit Workspace</h2>
        {[
          { label: 'Client / Company Name *', key: 'name', placeholder: 'Adani Defence & Aerospace' },
          { label: 'URL Slug *', key: 'slug', placeholder: 'adani-da' },
          { label: 'Description', key: 'description', placeholder: 'Brief description…' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{f.label}</label>
            <input
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              required={f.key !== 'description'}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="submit" style={{ flex: 1, padding: 10, background: C.blue, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Save Changes</button>
          <button type="button" onClick={onClose} style={{ padding: '10px 18px', border: `1px solid ${C.border}`, borderRadius: 7, fontWeight: 600, cursor: 'pointer', background: '#fff' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── Manage Client Users Modal ─────────────────────────────────
function ManageUsersModal({ client, onClose, showToast }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'member' });

  useEffect(() => {
    getClientUsers(client.id)
      .then(setUsers)
      .catch(() => showToast('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  }, [client.id]);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      const u = await addClientUser(client.id, form);
      setUsers(prev => {
        const exists = prev.find(x => x.id === u.id);
        return exists ? prev.map(x => x.id === u.id ? u : x) : [...prev, u];
      });
      setForm({ name: '', email: '', password: '', role: 'member' });
      setAdding(false);
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
    } catch { showToast('Error removing user', 'error'); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.blue }}>Workspace Users</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>{client.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.muted }}>×</button>
        </div>

        {/* Users list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading…</div>
          ) : (
            <>
              {users.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.lightBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: C.blue, flexShrink: 0 }}>
                    {u.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{u.name} {u.is_super_admin && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#B45309', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>Super Admin</span>}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{u.email}</div>
                  </div>
                  <select
                    value={u.workspace_role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', color: C.text }}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                  <button onClick={() => handleRemove(u.id)} style={{ ...btn(C.red, '#FEF2F2', '#FCA5A5'), padding: '4px 10px' }}>Remove</button>
                </div>
              ))}
              {users.length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>No users in this workspace yet.</p>}
            </>
          )}
        </div>

        {/* Add user section */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}` }}>
          {!adding ? (
            <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={() => setAdding(true)}>+ Add / Invite User</button>
          ) : (
            <form onSubmit={handleAdd}>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: C.muted }}>Enter email of an existing user to add them, or fill all fields to create a new user.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {[
                  { label: 'Full Name (new users)', key: 'name', type: 'text', placeholder: 'Jane Doe' },
                  { label: 'Email *', key: 'email', type: 'email', placeholder: 'jane@org.com', required: true },
                  { label: 'Password (new users)', key: 'password', type: 'password', placeholder: '••••••' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      required={f.required}
                      style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>Workspace Role</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}>
                    <option value="member">Member (view only)</option>
                    <option value="admin">Admin (can edit)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={btn('#fff', C.blue, C.blue)}>Add to Workspace</button>
                <button type="button" onClick={() => setAdding(false)} style={btn(C.muted, '#fff', C.border)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Super Admin Main Page ─────────────────────────────────────
export default function SuperAdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Prism - Super Admin'; }, []);

  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [managing,     setManaging]     = useState(null);
  const [editing,      setEditing]      = useState(null);
  const [showCreate,   setShowCreate]   = useState(false);
  const [form,         setForm]         = useState({ name: '', slug: '', description: '' });
  const [toast,        setToast]        = useState(null);

  function showToast(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); }

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() => showToast('Failed to load clients', 'error'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const c = await createClient(form);
      setClients(prev => [...prev, { ...c, member_count: 0 }]);
      setShowCreate(false);
      setForm({ name: '', slug: '', description: '' });
      showToast('Workspace created');
    } catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
  }

  async function handleEdit(id, form) {
    try {
      const updated = await updateClient(id, form);
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      setEditing(null);
      showToast('Workspace updated');
    } catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
  }

  async function handleDelete(client) {
    if (!window.confirm(`Delete workspace "${client.name}" and ALL its data? This cannot be undone.`)) return;
    try {
      await deleteClient(client.id);
      setClients(prev => prev.filter(c => c.id !== client.id));
      showToast('Workspace deleted');
    } catch { showToast('Error deleting workspace', 'error'); }
  }

  function handleEnter(client) {
    localStorage.setItem('prism_client_id', client.id);
    navigate(`/w/${client.slug}`);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB' }}>
      {/* Header */}
      <div style={{ background: C.blue, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>⚡ Prism Super Admin</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{user?.name}</span>
          <button onClick={() => navigate('/workspaces')} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
            Workspaces
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Client Workspaces</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>{clients.length} workspace{clients.length !== 1 ? 's' : ''} across the platform</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ padding: '9px 20px', background: C.blue, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + New Workspace
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>Loading workspaces…</div>
        ) : clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
            <p>No workspaces yet. Create the first one.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
            {clients.map(c => (
              <ClientCard
                key={c.id}
                client={c}
                onEdit={setEditing}
                onManage={setManaging}
                onDelete={handleDelete}
                onEnter={handleEnter}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create workspace modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreate} style={{ background: '#fff', borderRadius: 16, padding: 32, width: 480, boxShadow: '0 12px 48px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: C.blue }}>New Client Workspace</h2>
            {[
              { label: 'Client / Company Name *', key: 'name', placeholder: 'Adani Defence & Aerospace' },
              { label: 'URL Slug *', key: 'slug', placeholder: 'adani-da' },
              { label: 'Description', key: 'description', placeholder: 'Brief description…' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>{f.label}</label>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(p => {
                    const next = { ...p, [f.key]: e.target.value };
                    if (f.key === 'name') next.slug = slugify(e.target.value);
                    return next;
                  })}
                  placeholder={f.placeholder}
                  required={f.key !== 'description'}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="submit" style={{ flex: 1, padding: 10, background: C.blue, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Create Workspace</button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '10px 18px', border: `1px solid ${C.border}`, borderRadius: 7, fontWeight: 600, cursor: 'pointer', background: '#fff' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <EditClientModal
          client={editing}
          onSave={handleEdit}
          onClose={() => setEditing(null)}
        />
      )}

      {managing && (
        <ManageUsersModal
          client={managing}
          onClose={() => setManaging(null)}
          showToast={showToast}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
