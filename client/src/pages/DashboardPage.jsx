import React, { useState, useEffect, useCallback } from 'react';
import { getRoles, createRole, deleteRole } from '../api';
import { useAuth } from '../context/AuthContext';
import StatsBar    from '../components/StatsBar';
import RolesTable  from '../components/RolesTable';
import RoleDrawer  from '../components/RoleDrawer';
import AddRoleModal from '../components/AddRoleModal';
import Toast       from '../components/Toast';

export default function DashboardPage() {
  const { canEdit, isAdmin } = useAuth();
  const [roles,       setRoles]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedId,  setSelectedId]  = useState(null);
  const [showAdd,     setShowAdd]     = useState(false);
  const [toast,       setToast]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [diffFilter,  setDiffFilter]  = useState('');

  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch {
      showToast('Failed to load roles', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  async function handleCreate(body) {
    try {
      const created = await createRole(body);
      setRoles(prev => [...prev, created]);
      setShowAdd(false);
      showToast('Role created successfully');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create role', 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this role? This cannot be undone.')) return;
    try {
      await deleteRole(id);
      setRoles(prev => prev.filter(r => r.id !== id));
      if (selectedId === id) setSelectedId(null);
      showToast('Role deleted');
    } catch {
      showToast('Failed to delete role', 'error');
    }
  }

  function handleRoleUpdate(updated) {
    setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
  }

  const filtered = roles.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || (r.experience||'').toLowerCase().includes(q);
    const matchDiff   = !diffFilter || r.difficulty === diffFilter;
    return matchSearch && matchDiff;
  });

  return (
    <div style={{ padding:'28px 28px', maxWidth:1440, margin:'0 auto' }}>
      {/* Stats */}
      <StatsBar roles={roles} />

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'24px 0 14px' }}>
        <h2 style={{ fontSize:18, fontWeight:700, color:'#00259C' }}>
          All Roles — Dashboard
          <span style={{ fontSize:13, fontWeight:400, color:'#999', marginLeft:10 }}>
            {filtered.length} of {roles.length}
          </span>
        </h2>

        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search roles…"
            style={{ padding:'7px 12px', border:'1px solid #e2e0d4', borderRadius:7, background:'#faf9f3', fontSize:13, width:200, outline:'none' }}
          />
          <select
            value={diffFilter} onChange={e => setDiffFilter(e.target.value)}
            style={{ padding:'7px 12px', border:'1px solid #e2e0d4', borderRadius:7, background:'#faf9f3', fontSize:13, outline:'none' }}
          >
            <option value="">All Difficulty</option>
            <option value="green">🟢 Easy</option>
            <option value="yellow">🟡 Moderate</option>
            <option value="red">🔴 Hard</option>
          </select>
          {canEdit && (
            <button
              onClick={() => setShowAdd(true)}
              style={{ padding:'7px 18px', background:'#00259C', color:'#fff', border:'none', borderRadius:7, fontWeight:700, fontSize:13, cursor:'pointer' }}
            >
              + Add Role
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Loading roles…</div>
      ) : (
        <RolesTable
          roles={filtered}
          onSelect={setSelectedId}
          onDelete={isAdmin ? handleDelete : null}
          selectedId={selectedId}
        />
      )}

      {/* Role detail drawer */}
      {selectedId && (
        <RoleDrawer
          roleId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={handleRoleUpdate}
          showToast={showToast}
        />
      )}

      {/* Add role modal */}
      {showAdd && (
        <AddRoleModal
          onClose={() => setShowAdd(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
