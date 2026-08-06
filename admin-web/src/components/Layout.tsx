import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/users', label: 'Manajemen User', icon: '👥' },
  { path: '/materials', label: 'Materi', icon: '📚' },
  { path: '/violations', label: 'Pelanggaran', icon: '⚠️' },
  { path: '/attendance', label: 'Absensi', icon: '📋' },
  { path: '/announcements', label: 'Pengumuman', icon: '📢' },
];

export default function Layout() {
  const { adminUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>ES</div>
          <div>
            <div style={styles.appName}>EduTech SMK</div>
            <div style={styles.appRole}>Admin Portal</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>{adminUser?.name?.[0] ?? 'A'}</div>
            <div>
              <div style={styles.userName}>{adminUser?.name}</div>
              <div style={styles.userRole}>Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Keluar</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' },
  sidebar: {
    width: 240, backgroundColor: '#0F172A', display: 'flex', flexDirection: 'column',
    padding: '20px 0', flexShrink: 0,
  },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 20px', borderBottom: '1px solid #1E293B' },
  logo: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#4F46E5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, fontWeight: 800, color: '#FFFFFF', flexShrink: 0,
  },
  appName: { fontSize: 15, fontWeight: 700, color: '#FFFFFF' },
  appRole: { fontSize: 11, color: '#64748B' },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 8, textDecoration: 'none', color: '#94A3B8',
    fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
  },
  navItemActive: { backgroundColor: '#1E293B', color: '#FFFFFF' },
  navIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid #1E293B' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  userAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#4F46E5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, color: '#FFFFFF', flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: '#E2E8F0' },
  userRole: { fontSize: 11, color: '#64748B' },
  logoutBtn: {
    width: '100%', padding: '8px 0', backgroundColor: '#1E293B', color: '#94A3B8',
    border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  main: { flex: 1, overflow: 'auto', backgroundColor: '#F8FAFC' },
};
