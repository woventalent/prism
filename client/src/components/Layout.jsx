import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClient } from '../context/ClientContext';

const s = {
  shell:   { display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  header:  { background: '#00259C', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, flexShrink: 0 },
  logo:    { color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '-0.2px', lineHeight: 1.2 },
  sub:     { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 400, marginTop: 2 },
  nav:     { display: 'flex', alignItems: 'center', gap: 6 },
  navLink: (active) => ({
    padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600,
    color: active ? '#00259C' : 'rgba(255,255,255,0.85)',
    background: active ? '#fff' : 'transparent',
    transition: 'all 0.15s', textDecoration: 'none', border: 'none', cursor: 'pointer',
  }),
  userChip: { display: 'flex', alignItems: 'center', gap: 10, position: 'relative' },
  avatar:   { width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 },
  main:     { flex: 1 },
};

export default function Layout() {
  const { user, logout, isSuperAdmin } = useAuth();
  const { client, workspaceRole } = useClient() || {};
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const base = client ? `/w/${client.slug}` : '';

  function handleLogout() { logout(); navigate('/login'); }

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleLabel = workspaceRole === 'admin' ? 'Admin' : 'Member';

  return (
    <div style={s.shell}>
      <header style={s.header}>
        {/* Branding */}
        <div>
          <div style={s.logo}>{client?.name || 'Prism · Woven Talent'}</div>
          <div style={s.sub}>Talent Intelligence Platform</div>
        </div>


        {/* User chip */}
        <div style={s.userChip} ref={menuRef}>
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{user?.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>{roleLabel}</div>
          </div>

          <button
            onClick={() => setMenuOpen(o => !o)}
            title="Settings"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', width: 30, height: 30, borderRadius: 6, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >⚙</button>

          {menuOpen && (
            <div style={{ position: 'absolute', top: 46, right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #E2E8F0', minWidth: 200, zIndex: 999, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{user?.email}</div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#00259C', marginTop: 3 }}>{roleLabel}</div>
              </div>

              <button
                onClick={() => { setMenuOpen(false); navigate(`${base}/settings`); }}
                style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#1E293B', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFF'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >⚙&nbsp; Settings</button>

              <button
                onClick={() => { setMenuOpen(false); navigate('/workspaces'); }}
                style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#1E293B', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFF'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >⇄&nbsp; Switch Workspace</button>

              {isSuperAdmin && (
                <button
                  onClick={() => { setMenuOpen(false); navigate('/super-admin'); }}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#1E293B', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFF'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >⚡&nbsp; Super Admin</button>
              )}

              <div style={{ borderTop: '1px solid #F1F5F9' }}>
                <button
                  onClick={handleLogout}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#DC2626', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >↩&nbsp; Logout</button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main style={s.main}><Outlet /></main>
    </div>
  );
}
