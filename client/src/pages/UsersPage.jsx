import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({ name:'', email:'', password:'', role:'recruiter' });

  function showToast(msg, type='success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    getUsers().then(setUsers).catch(() => showToast('Failed to load users','error')).finally(() => setLoading(false));
  }, []);

  function openAdd() { setForm({ name:'', email:'', password:'', role:'recruiter' }); setEditing(null); setShowAdd(true); }
  function openEdit(u) { setForm({ name:u.name, email:u.email, password:'', role:u.role }); setEditing(u); setShowAdd(true); }

  async function handleSave() {
    try {
      if (editing) {
        const body = { name:form.name, email:form.email, role:form.role };
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

  const roleBadge = { admin:'#00259C', recruiter:'#b45309', viewer:'#555' };
  const roleBg    = { admin:'#e8edfa', recruiter:'#fef3c7', viewer:'#f0ede0' };

  return (
    <div style={{ padding:'28px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:'#00259C' }}>User Management</h2>
        <button
          onClick={openAdd}
          style={{ padding:'8px 18px', background:'#00259C', color:'#fff', border:'none', borderRadius:7, fontWeight:700, fontSize:13, cursor:'pointer' }}
        >+ Add User</button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Loading…</div> : (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e0d4', overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f5f3e8' }}>
                {['Name','Email','Role','Created','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#00259C', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid #e2e0d4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom:'1px solid #f0ede0' }}>
                  <td style={{ padding:'13px 16px', fontWeight:600 }}>{u.name}</td>
                  <td style={{ padding:'13px 16px', color:'#666', fontSize:13 }}>{u.email}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ background:roleBg[u.role], color:roleBadge[u.role], padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, textTransform:'uppercase' }}>{u.role}</span>
                  </td>
                  <td style={{ padding:'13px 16px', color:'#999', fontSize:12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => openEdit(u)} style={{ padding:'4px 12px', borderRadius:5, border:'1px solid #e2e0d4', background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', color:'#00259C' }}>Edit</button>
                      {u.id !== me?.id && (
                        <button onClick={() => handleDelete(u.id)} style={{ padding:'4px 12px', borderRadius:5, border:'none', background:'#fee2e2', color:'#dc2626', fontSize:12, fontWeight:600, cursor:'pointer' }}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit modal */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:14, padding:32, width:440, boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize:17, fontWeight:700, color:'#00259C', marginBottom:20 }}>{editing ? 'Edit User' : 'Add User'}</h3>
            {[
              { label:'Full Name', key:'name', type:'text', placeholder:'Jane Doe' },
              { label:'Email', key:'email', type:'email', placeholder:'jane@org.com' },
              { label: editing ? 'New Password (leave blank to keep)' : 'Password', key:'password', type:'password', placeholder:'••••••' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#444', marginBottom:5 }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]:e.target.value }))} placeholder={f.placeholder}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e0d4', borderRadius:7, background:'#faf9f3', fontSize:13, outline:'none' }} />
              </div>
            ))}
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#444', marginBottom:5 }}>Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role:e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e0d4', borderRadius:7, background:'#faf9f3', fontSize:13, outline:'none' }}>
                <option value="admin">Admin</option>
                <option value="recruiter">Recruiter</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleSave} style={{ flex:1, padding:'10px', background:'#00259C', color:'#fff', border:'none', borderRadius:7, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                {editing ? 'Save Changes' : 'Create User'}
              </button>
              <button onClick={() => setShowAdd(false)} style={{ padding:'10px 18px', background:'transparent', border:'1px solid #e2e0d4', borderRadius:7, fontWeight:600, fontSize:14, cursor:'pointer' }}>
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
