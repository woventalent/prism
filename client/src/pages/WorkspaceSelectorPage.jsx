import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const C = { blue: '#00259C', lightBlue: '#E8EDFB', border: '#E2E8F0', muted: '#64748B', text: '#1E293B' };

export default function WorkspaceSelectorPage() {
  const { user, clients, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Prism - Workspaces'; }, []);

  function enter(client) {
    localStorage.setItem('prism_client_id', client.id);
    navigate(`/w/${client.slug}`);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: C.blue, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Prism · Woven Talent</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isSuperAdmin && (
            <button
              onClick={() => navigate('/super-admin')}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer' }}
            >
              ⚡ Super Admin
            </button>
          )}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', padding: '48px 24px', width: '100%' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text }}>Select Workspace</h1>
          <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>
            Welcome back, {user?.name}. Choose a client workspace to continue.
          </p>
        </div>

        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>You haven't been added to any workspace yet.</p>
            <p style={{ fontSize: 13 }}>Contact your Super Admin to get access.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => enter(c)}
                style={{
                  background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14,
                  padding: '24px 20px', textAlign: 'left', cursor: 'pointer',
                  transition: 'box-shadow 0.15s, border-color 0.15s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,37,156,0.12)'; e.currentTarget.style.borderColor = '#93A8DC'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.border; }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: C.lightBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>🏢</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>{c.name}</div>
                {c.description && <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{c.description}</div>}
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: 0.5, padding: '2px 8px', borderRadius: 99,
                  background: (c.workspace_role || c.my_role) === 'admin' ? C.lightBlue : '#F1F5F9',
                  color: (c.workspace_role || c.my_role) === 'admin' ? C.blue : C.muted,
                }}>
                  {c.workspace_role || c.my_role}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
