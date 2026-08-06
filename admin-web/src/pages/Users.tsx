import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, Timestamp, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';

const ROLES = ['STUDENT', 'TEACHER', 'WALI', 'BK', 'PIKET', 'ADMIN'];
const ROLE_COLORS: Record<string, string> = {
  STUDENT: '#4F46E5', TEACHER: '#059669', WALI: '#D97706',
  BK: '#DC2626', PIKET: '#7C3AED', ADMIN: '#0F172A',
};

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: 'password123', role: 'STUDENT', nis: '', nip: '' });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = users.filter(u => {
    const matchRole = !filterRole || u.role === filterRole;
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return alert('Nama, email, dan password wajib diisi.');
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const profile: any = {
        uid: cred.user.uid, name: form.name, email: form.email, role: form.role, createdAt: Timestamp.now(),
      };
      if (form.nis) profile.nis = form.nis;
      if (form.nip) profile.nip = form.nip;
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setShowModal(false);
      setForm({ name: '', email: '', password: 'password123', role: 'STUDENT', nis: '', nip: '' });
      loadUsers();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uid: string, name: string) => {
    if (!confirm(`Hapus user "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    await deleteDoc(doc(db, 'users', uid));
    loadUsers();
  };

  const handleRoleChange = async (uid: string, role: string) => {
    await updateDoc(doc(db, 'users', uid), { role });
    loadUsers();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manajemen User</h1>
          <p style={styles.subtitle}>{users.length} pengguna terdaftar</p>
        </div>
        <button onClick={() => setShowModal(true)} style={styles.addBtn}>+ Tambah User</button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Cari nama atau email..." style={styles.searchInput}
        />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={styles.select}>
          <option value="">Semua Role</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? <p style={{ color: '#64748B' }}>Memuat...</p> : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Nama</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>NIS/NIP</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={{ ...styles.avatar, backgroundColor: ROLE_COLORS[u.role] ?? '#64748B' }}>
                        {u.name?.[0] ?? '?'}
                      </div>
                      <span style={styles.userName}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, color: '#64748B', fontSize: 13 }}>{u.email}</td>
                  <td style={styles.td}>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.uid || u.id, e.target.value)}
                      style={{ ...styles.roleSelect, color: ROLE_COLORS[u.role] ?? '#64748B' }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{ ...styles.td, color: '#64748B', fontSize: 13 }}>
                    {u.nis || u.nip || '-'}
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => handleDelete(u.uid || u.id, u.name)} style={styles.deleteBtn}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>Tidak ada user ditemukan</p>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Tambah User Baru</h2>
            <form onSubmit={handleCreate}>
              {[
                { key: 'name', label: 'Nama Lengkap *', type: 'text', placeholder: 'Nama lengkap' },
                { key: 'email', label: 'Email *', type: 'email', placeholder: 'email@sekolah.sch.id' },
                { key: 'password', label: 'Password *', type: 'password', placeholder: 'Min. 6 karakter' },
                { key: 'nis', label: 'NIS (jika siswa)', type: 'text', placeholder: 'Nomor Induk Siswa' },
                { key: 'nip', label: 'NIP (jika guru)', type: 'text', placeholder: 'Nomor Induk Pegawai' },
              ].map(f => (
                <div key={f.key} style={styles.field}>
                  <label style={styles.label}>{f.label}</label>
                  <input
                    type={f.type} value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={styles.input} placeholder={f.placeholder}
                  />
                </div>
              ))}
              <div style={styles.field}>
                <label style={styles.label}>Role *</label>
                <select value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))} style={styles.input}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={styles.modalBtns}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Batal</button>
                <button type="submit" disabled={saving} style={styles.saveBtn}>
                  {saving ? 'Menyimpan...' : 'Buat User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 3 },
  addBtn: { padding: '10px 18px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  filters: { display: 'flex', gap: 12, marginBottom: 16 },
  searchInput: { flex: 1, padding: '9px 14px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none' },
  select: { padding: '9px 14px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', cursor: 'pointer' },
  tableWrapper: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#F8FAFC' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0' },
  tr: { borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.1s' },
  td: { padding: '12px 16px', fontSize: 14, color: '#1E293B', verticalAlign: 'middle' },
  userCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#FFFFFF', flexShrink: 0 },
  userName: { fontWeight: 600 },
  roleSelect: { padding: '4px 8px', border: '1.5px solid #E2E8F0', borderRadius: 6, fontWeight: 700, cursor: 'pointer', backgroundColor: '#F8FAFC' },
  deleteBtn: { padding: '5px 12px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 18, fontWeight: 800, color: '#1E293B', marginBottom: 20, marginTop: 0 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  modalBtns: { display: 'flex', gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, padding: '10px 0', border: '1.5px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, backgroundColor: '#FFFFFF' },
  saveBtn: { flex: 1, padding: '10px 0', backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
};
