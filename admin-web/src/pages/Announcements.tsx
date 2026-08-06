import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  '': 'Semua', STUDENT: 'Siswa', TEACHER: 'Guru Mapel',
  WALI: 'Wali Kelas', BK: 'Guru BK', PIKET: 'Guru Piket',
};

export default function Announcements() {
  const { adminUser } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', targetRole: '', isUrgent: false });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const snap = await getDocs(collection(db, 'announcements'));
    setAnnouncements(snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.())
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return alert('Judul dan isi wajib diisi.');
    setSaving(true);
    try {
      const data: any = {
        title: form.title.trim(), body: form.body.trim(),
        isUrgent: form.isUrgent, createdBy: adminUser!.uid, createdAt: Timestamp.now(),
      };
      if (form.targetRole) data.targetRole = form.targetRole;
      await addDoc(collection(db, 'announcements'), data);
      setShowForm(false);
      setForm({ title: '', body: '', targetRole: '', isUrgent: false });
      load();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus pengumuman "${title}"?`)) return;
    await deleteDoc(doc(db, 'announcements', id));
    load();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Pengumuman Sekolah</h1>
          <p style={styles.subtitle}>{announcements.length} pengumuman</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? '✕ Tutup' : '+ Buat Pengumuman'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Buat Pengumuman Baru</h3>
          <form onSubmit={handleCreate}>
            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Judul *</label>
                <input style={styles.input} value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Judul pengumuman" />
              </div>
              <div>
                <label style={styles.label}>Kirim Ke</label>
                <select style={styles.input} value={form.targetRole}
                  onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <label style={styles.label}>Isi Pengumuman *</label>
            <textarea
              style={{ ...styles.input, height: 100, resize: 'vertical' }}
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              placeholder="Tulis pengumuman di sini..."
            />
            <label style={styles.urgentRow}>
              <input type="checkbox" checked={form.isUrgent}
                onChange={e => setForm(p => ({ ...p, isUrgent: e.target.checked }))} />
              <span style={{ marginLeft: 8, color: '#DC2626', fontWeight: 600 }}>🚨 Tandai sebagai URGENT</span>
            </label>
            <div style={styles.formBtns}>
              <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>Batal</button>
              <button type="submit" disabled={saving} style={styles.saveBtn}>
                {saving ? 'Mengirim...' : 'Kirim Pengumuman'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? <p>Memuat...</p> : (
        <div style={styles.list}>
          {announcements.map(a => (
            <div key={a.id} style={{ ...styles.card, ...(a.isUrgent ? styles.cardUrgent : {}) }}>
              <div style={styles.cardTop}>
                {a.isUrgent && <span style={styles.urgentBadge}>🚨 URGENT</span>}
                {a.targetRole && (
                  <span style={styles.roleBadge}>👥 {ROLE_LABELS[a.targetRole] ?? a.targetRole}</span>
                )}
              </div>
              <div style={styles.cardTitle}>{a.title}</div>
              <div style={styles.cardBody}>{a.body}</div>
              <div style={styles.cardFooter}>
                <span style={styles.cardDate}>{a.createdAt?.toDate?.().toLocaleString('id-ID')}</span>
                <button onClick={() => handleDelete(a.id, a.title)} style={styles.deleteBtn}>Hapus</button>
              </div>
            </div>
          ))}
          {announcements.length === 0 && <p style={{ color: '#94A3B8' }}>Belum ada pengumuman</p>}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0 },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 3 },
  addBtn: { padding: '10px 18px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  formTitle: { fontSize: 16, fontWeight: 700, color: '#1E293B', margin: '0 0 16px' },
  formRow: { display: 'flex', gap: 12, marginBottom: 12 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' } as any,
  urgentRow: { display: 'flex', alignItems: 'center', margin: '10px 0', cursor: 'pointer' },
  formBtns: { display: 'flex', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, padding: '9px 0', border: '1.5px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, backgroundColor: '#FFFFFF' },
  saveBtn: { flex: 2, padding: '9px 0', backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 16, borderLeft: '4px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  cardUrgent: { borderLeftColor: '#DC2626' },
  cardTop: { display: 'flex', gap: 6, marginBottom: 6 },
  urgentBadge: { padding: '2px 8px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: 12, fontSize: 11, fontWeight: 700 },
  roleBadge: { padding: '2px 8px', backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 6 },
  cardBody: { fontSize: 14, color: '#64748B', lineHeight: 1.6 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardDate: { fontSize: 11, color: '#94A3B8' },
  deleteBtn: { padding: '4px 10px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
};
