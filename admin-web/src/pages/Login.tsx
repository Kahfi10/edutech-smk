import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Email dan password wajib diisi.');
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.code === 'auth/invalid-credential' ? 'Email atau password salah.' : 'Gagal masuk. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logo}>E</div>
        </div>
        <h1 style={s.title}>EduTech SMK</h1>
        <p style={s.subtitle}>Admin Portal</p>

        <form onSubmit={handleLogin} style={s.form}>
          {error && <div style={s.errorBox}>{error}</div>}

          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={s.input} placeholder="admin@edutechsmk.sch.id" autoFocus
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={{ position:'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...s.input, paddingRight:40 }} placeholder="Masukkan password"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={s.eyeBtn}>
                {showPw ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width:16, height:16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width:16, height:16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p style={s.note}>Akses khusus Administrator Sekolah</p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
    background:'#F5F5F7',
  },
  card: {
    background:'#fff', borderRadius:16, padding:'36px 32px', width:'100%', maxWidth:380,
    boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
    textAlign:'center',
  },
  logoWrap: { display:'flex', justifyContent:'center', marginBottom:14 },
  logo: {
    width:52, height:52, borderRadius:14, background:'#1D1D1F',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:22, fontWeight:800, color:'#fff',
  },
  title:    { fontSize:22, fontWeight:700, color:'#1D1D1F', margin:'0 0 4px' },
  subtitle: { fontSize:13, color:'#86868B', marginBottom:24 },
  form:     { textAlign:'left' },
  field:    { marginBottom:14 },
  label:    { display:'block', fontSize:12, fontWeight:600, color:'#6E6E73', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.4px' },
  input: {
    width:'100%', padding:'10px 12px', border:'1px solid #E5E5EA', borderRadius:9,
    fontSize:14, color:'#1D1D1F', outline:'none', transition:'border-color 0.15s',
    boxSizing:'border-box' as const, background:'#FAFAFA',
  },
  eyeBtn: {
    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
    background:'none', border:'none', cursor:'pointer', color:'#86868B', padding:4,
  },
  errorBox: {
    background:'#FFF2F2', border:'1px solid #FFCDD2', borderRadius:8,
    padding:'9px 12px', color:'#C62828', fontSize:13, marginBottom:14,
  },
  submitBtn: {
    width:'100%', padding:'11px 0', background:'#1D1D1F', color:'#fff',
    border:'none', borderRadius:9, fontSize:14, fontWeight:600, cursor:'pointer',
    marginTop:6, transition:'opacity 0.15s',
  },
  note: { fontSize:12, color:'#AEAEB2', marginTop:20 },
};
