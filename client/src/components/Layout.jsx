import React, { useState } from 'react';
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
  userChip:{ display:'flex', alignItems:'center', gap:10 },
  avatar:  { width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 },
  rolePill:{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, padding:'2px 8px', borderRadius:99, background:'rgba(255,255,255,0.15)', color:'#fff' },
  logoutBtn:{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', padding:'5px 14px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' },
  main:    { flex:1 },
};

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

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
          {isAdmin && <NavLink to="/users" style={({ isActive }) => s.navLink(isActive)}>Users</NavLink>}
        </nav>

        <div style={s.userChip}>
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:600 }}>{user?.name}</div>
            <div style={s.rolePill}>{user?.role}</div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}
