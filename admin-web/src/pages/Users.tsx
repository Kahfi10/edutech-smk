import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';

const ROLES = ['STUDENT','TEACHER','WALI','BK','PIKET','ADMIN'];

export default function Users() {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name:'', email:'', password:'password123', role:'STUDENT', nis:'', nip:'' });

  const load = async () => {
    const snap = await getDocs(collection(db, 'users'));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return alert('Nama, email, password wajib.');
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const profile: any = { uid: cred.user.uid, name: form.name, email: form.email, role: form.role, createdAt: Timestamp.now() };
      if (form.nis) profile.nis = form.nis;
      if (form.nip) profile.nip = form.nip;
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setModal(false);
      setForm({ name:'', email:'', password:'password123', role:'STUDENT', nis:'', nip:'' });
      load();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (uid: string, name: string) => {
    if (!confirm(`Hapus "${name}"?`)) return;
    await deleteDoc(doc(db, 'users', uid));
    load();
  };

  const handleRoleChange = async (uid: string, role: string) => {
    await updateDoc(doc(db, 'users', uid), { role });
    load();
  };

  const ROLE_COLOR: Record<string, string> = { STUDENT:'#34C759', TEACHER:'#007AFF', WALI:'#FF9500', BK:'#FF3B30', PIKET:'#AF52DE', ADMIN:'#1D1D1F' };

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Pengguna</h1>
          <p style={s.pageDesc}>{users.length} akun terdaftar</p>
        </div>
        <button onClick={() => setModal(true)} style={s.primaryBtn}>Tambah Pengguna</button>
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        <div style={s.searchWrap}>
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:15, height:15, color:'#AEAEB2', flexShrink:0 }}>
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau email..." style={s.searchInput} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={s.select}>
          <option value="">Semua Role</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? <p style={s.loading}>Memuat...</p> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Nama', 'Email', 'Role', 'NIS / NIP', 'Aksi'].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 ? '#FAFAFA' : '#fff' }}>
                  <td style={s.td}>
                    <div style={s.userCell}>
                      <div style={{ ...s.avatar, background: ROLE_COLOR[u.role] ?? '#86868B' }}>
                        {u.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span style={{ fontWeight:500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ ...s.td, color:'#86868B' }}>{u.email}</td>
                  <td style={s.td}>
                    <select value={u.role} onChange={e => handleRoleChange(u.uid || u.id, e.target.value)} style={{ ...s.roleSelect, color: ROLE_COLOR[u.role] ?? '#86868B' }}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{ ...s.td, color:'#86868B' }}>{u.nis || u.nip || '—'}</td>
                  <td style={s.td}>
                    <button onClick={() => handleDelete(u.uid || u.id, u.name)} style={s.deleteBtn}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ padding:20, textAlign:'center', color:'#86868B', fontSize:13 }}>Tidak ada pengguna</p>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Tambah Pengguna</h2>
            <form onSubmit={handleCreate}>
              {[
                { key:'name',     label:'Nama Lengkap',  type:'text',     ph:'Nama lengkap' },
                { key:'email',    label:'Email',         type:'email',    ph:'email@sekolah.sch.id' },
                { key:'password', label:'Password',      type:'password', ph:'Min. 6 karakter' },
                { key:'nis',      label:'NIS (siswa)',   type:'text',     ph:'Opsional' },
                { key:'nip',      label:'NIP (guru)',    type:'text',     ph:'Opsional' },
              ].map(f => (
                <div key={f.key} style={s.field}>
                  <label style={s.label}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={s.input} placeholder={f.ph} />
                </div>
              ))}
              <div style={s.field}>
                <label style={s.label}>Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={s.input}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={s.modalBtns}>
                <button type="button" onClick={() => setModal(false)} style={s.cancelBtn}>Batal</button>
                <button type="submit" disabled={saving} style={{ ...s.primaryBtn, flex:1 }}>{saving ? 'Menyimpan...' : 'Buat Akun'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding:28 },
  pageHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 },
  pageTitle: { fontSize:22, fontWeight:700, color:'#1D1D1F' },
  pageDesc:  { fontSize:13, color:'#86868B', marginTop:3 },
  primaryBtn: {
    padding:'8px 16px', background:'#1D1D1F', color:'#fff', border:'none',
    borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600,
  },
  filterRow: { display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' as const },
  searchWrap: {
    display:'flex', alignItems:'center', gap:8, background:'#fff',
    border:'1px solid #E5E5EA', borderRadius:8, padding:'7px 12px', flex:1, minWidth:200,
  },
  searchInput: { border:'none', outline:'none', fontSize:13, flex:1, color:'#1D1D1F', background:'transparent' },
  select: { padding:'8px 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, outline:'none', background:'#fff', color:'#1D1D1F', cursor:'pointer' },
  tableWrap: { background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #E5E5EA' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'#86868B', textTransform:'uppercase', letterSpacing:'0.4px', borderBottom:'1px solid #E5E5EA', background:'#FAFAFA' },
  td: { padding:'11px 16px', fontSize:13, color:'#1D1D1F', borderBottom:'1px solid #F5F5F7' },
  userCell: { display:'flex', alignItems:'center', gap:10 },
  avatar: { width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 },
  roleSelect: { padding:'3px 6px', border:'1px solid #E5E5EA', borderRadius:5, fontWeight:600, cursor:'pointer', background:'#FAFAFA', fontSize:12 },
  deleteBtn: { padding:'4px 10px', background:'#FFF2F2', color:'#FF3B30', border:'1px solid #FFCDD2', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:500 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 },
  modalBox: { background:'#fff', borderRadius:14, padding:24, width:420, maxHeight:'85vh', overflowY:'auto' },
  modalTitle: { fontSize:17, fontWeight:700, color:'#1D1D1F', marginBottom:18 },
  field: { marginBottom:13 },
  label: { display:'block', fontSize:11, fontWeight:600, color:'#6E6E73', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.4px' },
  input: { width:'100%', padding:'9px 11px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' as const, color:'#1D1D1F' },
  modalBtns: { display:'flex', gap:8, marginTop:18 },
  cancelBtn: { flex:1, padding:'9px', border:'1px solid #E5E5EA', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500, background:'#fff' },
  loading: { padding:20, color:'#86868B', fontSize:13 },
};
