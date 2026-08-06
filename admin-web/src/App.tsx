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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
        <p style={{ color: '#64748B' }}>Memuat EduTech SMK Admin...</p>
      </div>
    </div>
  );
  if (!user || !adminUser) return <Navigate to="/login" replace />;
  if (adminUser.role !== 'ADMIN') return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🚫</div>
        <h2>Akses Ditolak</h2>
        <p style={{ color: '#64748B' }}>Halaman ini hanya untuk Administrator.</p>
        <button onClick={() => window.location.href = '/login'} style={{ marginTop: 16, padding: '10px 20px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Kembali ke Login
        </button>
      </div>
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
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="materials" element={<Materials />} />
            <Route path="violations" element={<Violations />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="announcements" element={<Announcements />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
