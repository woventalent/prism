import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  shell:   { display:'flex', flexDirection:'column', minHeight:'100vh' },
  header:  { background:'#00259C', padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60, flexShrink:0 },
  logo:    { color:'#fff', fontWeight:800, fontSize:18, letterSpacing:'-0.3px', lineHeight:1.2 },
  sub:     { color:'rgba(255,255,255,0.55)', fontSize:11, fontWeight:400 },
  nav:     { display:'flex', alignItems:'center', gap:6 },
  navLink: (active) => ({
    padding:'6px 14px', borderRadius:7, fontSize:13, fontWeight:600,
    color: active ? '#00259C' : 'rgba(255,255,255,0.8)',
    background: active ? '#fff' : 'transparent',
    transition:'all 0.15s',
    textDecoration:'none',
    border:'none',
  }),
  userChip:{ display:'flex', alignItems:'center', gap:10, position:'relative' },
  avatar:  { width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 },
  rolePill:{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, padding:'2px 8px', borderRadius:99, background:'rgba(255,255,255,0.15)', color:'#fff' },
  logoutBtn:{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', padding:'5px 14px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' },
  main:    { flex:1 },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={s.shell}>
      <header style={s.header}>
        <div>
          <div style={s.logo}>Recruitment Command Centre</div>
          <div style={s.sub}>AEW&amp;C Mk-II — Active Hiring Pipeline</div>
        </div>

        <nav style={s.nav}>
          <NavLink to="/" end style={({ isActive }) => s.navLink(isActive)}>Dashboard</NavLink>
          <NavLink to="/knowledge" style={({ isActive }) => s.navLink(isActive)}>Knowledge Base</NavLink>
        </nav>

        {/* User chip with dropdown */}
        <div style={s.userChip} ref={menuRef}>
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:600 }}>{user?.name}</div>
            <div style={s.rolePill}>{user?.role}</div>
          </div>

          {/* Gear icon */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            title="Settings"
            style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', width:30, height:30, borderRadius:6, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          >
            ⚙
          </button>

          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div style={{ position:'absolute', top:44, right:0, background:'#fff', borderRadius:10, boxShadow:'0 8px 32px rgba(0,0,0,0.18)', border:'1px solid #E2E8F0', minWidth:180, zIndex:999, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px 8px', borderBottom:'1px solid #F1F5F9' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#1E293B' }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'#94A3B8', marginTop:1 }}>{user?.email}</div>
              </div>
              <button
                onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                style={{ display:'block', width:'100%', padding:'10px 14px', background:'none', border:'none', textAlign:'left', fontSize:13, color:'#1E293B', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}
                onMouseEnter={e => e.target.style.background='#F8FAFF'}
                onMouseLeave={e => e.target.style.background='none'}
              >
                ⚙&nbsp; Settings
              </button>
              <div style={{ borderTop:'1px solid #F1F5F9' }}>
                <button
                  onClick={handleLogout}
                  style={{ display:'block', width:'100%', padding:'10px 14px', background:'none', border:'none', textAlign:'left', fontSize:13, color:'#DC2626', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}
                  onMouseEnter={e => e.target.style.background='#FEF2F2'}
                  onMouseLeave={e => e.target.style.background='none'}
                >
                  ↩&nbsp; Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}
