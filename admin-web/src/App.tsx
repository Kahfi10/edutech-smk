import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Materials from './pages/Materials';
import Violations from './pages/Violations';
import Attendance from './pages/Attendance';
import Announcements from './pages/Announcements';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, adminUser, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#F5F5F7' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:'2px solid #E5E5EA', borderTopColor:'#1D1D1F', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ color:'#86868B', fontSize:13 }}>Memuat...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!user || !adminUser) return <Navigate to="/login" replace />;
  if (adminUser.role !== 'ADMIN') return (
    <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, background:'#F5F5F7' }}>
      <p style={{ fontSize:17, fontWeight:600, color:'#1D1D1F' }}>Akses Ditolak</p>
      <p style={{ color:'#86868B' }}>Halaman ini hanya untuk Administrator.</p>
      <button onClick={() => window.location.href='/login'} style={{ marginTop:8, padding:'8px 18px', background:'#1D1D1F', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:500 }}>
        Kembali ke Login
      </button>
    </div>
  );
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"     element={<Dashboard />} />
            <Route path="users"         element={<Users />} />
            <Route path="materials"     element={<Materials />} />
            <Route path="violations"    element={<Violations />} />
            <Route path="attendance"    element={<Attendance />} />
            <Route path="announcements" element={<Announcements />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
