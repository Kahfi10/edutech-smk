import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Email dan password wajib diisi.');
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.code === 'auth/invalid-credential' ? 'Email atau password salah.' : 'Gagal login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>ES</div>
        <h1 style={styles.title}>EduTech SMK</h1>
        <p style={styles.subtitle}>Admin Portal — Kepala Sekolah & Administrator</p>

        <form onSubmit={handleLogin} style={styles.form}>
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>Email Administrator</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="admin@sekolah.sch.id"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Masukkan password"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Masuk...' : 'Masuk ke Admin Portal'}
          </button>
        </form>

        <p style={styles.note}>
          🔒 Akses ini khusus untuk Admin & Kepala Sekolah.<br />
          Pengguna lain silakan gunakan aplikasi mobile.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center',
  },
  logo: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#4F46E5',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 800, color: '#1E293B', margin: '0 0 4px' },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 24 },
  form: { textAlign: 'left' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: {
    width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10,
    fontSize: 15, color: '#1E293B', backgroundColor: '#F8FAFC', outline: 'none', boxSizing: 'border-box',
  },
  errorBox: {
    backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
    padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 14,
  },
  button: {
    width: '100%', padding: '13px 0', backgroundColor: '#4F46E5', color: '#FFFFFF',
    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
    marginTop: 4,
  },
  note: { fontSize: 12, color: '#94A3B8', marginTop: 20, lineHeight: 1.5 },
};
