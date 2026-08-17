import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/dashboard',     label: 'Dashboard',       icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/users',         label: 'Pengguna',        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { path: '/materials',     label: 'Materi',          icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { path: '/violations',    label: 'Pelanggaran',     icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { path: '/attendance',    label: 'Absensi',         icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { path: '/announcements', label: 'Pengumuman',      icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
];

export default function Layout() {
  const { adminUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <nav style={s.sidebar}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandLogo}>
            {/* Logo buku terbuka */}
            <svg viewBox="0 0 24 24" fill="none" style={{ width:18, height:18 }}>
              <path
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div style={s.brandName}>EduTech SMK</div>
            <div style={s.brandSub}>Admin Portal</div>
          </div>
        </div>

        {/* Nav Items */}
        <ul style={s.navList}>
          {NAV.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navItemActive : {}) })}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ width:18, height:18, flexShrink:0 }}>
                  <path d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* User */}
        <div style={s.sidebarFooter}>
          <div style={s.userRow}>
            <div style={s.avatar}>{adminUser?.name?.[0] ?? 'A'}</div>
            <div style={{ overflow:'hidden' }}>
              <div style={s.userName}>{adminUser?.name}</div>
              <div style={s.userRole}>Administrator</div>
            </div>
          </div>
          <button
            onClick={async () => { await signOut(auth); navigate('/login'); }}
            style={s.logoutBtn}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ width:15, height:15 }}>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar
          </button>
        </div>
      </nav>

      {/* Main */}
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display:'flex', height:'100vh', overflow:'hidden', background:'#F5F5F7' },

  /* Sidebar */
  sidebar: {
    width:220, background:'#fff', display:'flex', flexDirection:'column',
    borderRight:'1px solid #E5E5EA', flexShrink:0, overflowY:'auto',
  },
  brand: {
    display:'flex', alignItems:'center', gap:10, padding:'20px 16px 16px',
    borderBottom:'1px solid #F5F5F7',
  },
  brandLogo: {
    width:34, height:34, borderRadius:9, background:'#1D1D1F',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:15, fontWeight:700, color:'#fff', flexShrink:0,
  },
  brandName: { fontSize:14, fontWeight:700, color:'#1D1D1F', lineHeight:1.2 },
  brandSub:  { fontSize:11, color:'#86868B', marginTop:1 },

  navList: { listStyle:'none', padding:'8px 8px', flex:1, display:'flex', flexDirection:'column', gap:2 },
  navItem: {
    display:'flex', alignItems:'center', gap:9, padding:'8px 10px',
    borderRadius:8, color:'#6E6E73', fontSize:13, fontWeight:500,
    transition:'all 0.12s', cursor:'pointer', textDecoration:'none',
  },
  navItemActive: { background:'#F5F5F7', color:'#1D1D1F', fontWeight:600 },

  sidebarFooter: { padding:'12px 12px 16px', borderTop:'1px solid #F5F5F7' },
  userRow: { display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  avatar: {
    width:30, height:30, borderRadius:'50%', background:'#1D1D1F',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:13, fontWeight:700, color:'#fff', flexShrink:0,
  },
  userName: { fontSize:12, fontWeight:600, color:'#1D1D1F', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  userRole: { fontSize:11, color:'#86868B' },
  logoutBtn: {
    width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
    padding:'7px 0', background:'#F5F5F7', border:'none', borderRadius:7,
    cursor:'pointer', fontSize:12, fontWeight:500, color:'#6E6E73',
  },

  main: { flex:1, overflow:'auto' },
};
