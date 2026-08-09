import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  '': 'Semua Warga Sekolah', STUDENT: 'Siswa', TEACHER: 'Guru Mapel',
  WALI: 'Wali Kelas', BK: 'Guru BK', PIKET: 'Guru Piket',
};

export default function Announcements() {
  const { adminUser } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({ title:'', body:'', targetRole:'', isUrgent: false });

  const load = async () => {
    const snap = await getDocs(collection(db, 'announcements'));
    setAnnouncements(
      snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
      setForm({ title:'', body:'', targetRole:'', isUrgent: false });
      load();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}"?`)) return;
    await deleteDoc(doc(db, 'announcements', id));
    load();
  };

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Pengumuman</h1>
          <p style={s.pageDesc}>{announcements.length} pengumuman</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={s.primaryBtn}>
          {showForm ? 'Tutup' : 'Buat Pengumuman'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Buat Pengumuman Baru</h3>
          <form onSubmit={handleCreate}>
            <div style={s.formRow}>
              <div style={{ flex:1 }}>
                <label style={s.label}>Judul</label>
                <input style={s.input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Judul pengumuman" />
              </div>
              <div>
                <label style={s.label}>Kirim Kepada</label>
                <select style={s.input} value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={s.label}>Isi Pengumuman</label>
              <textarea
                style={{ ...s.input, height:100, resize:'vertical' as const }}
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="Tulis isi pengumuman..."
              />
            </div>
            <label style={s.urgentRow}>
              <input type="checkbox" checked={form.isUrgent} onChange={e => setForm(p => ({ ...p, isUrgent: e.target.checked }))} />
              <span style={{ marginLeft:7, fontSize:13, color: form.isUrgent ? '#FF3B30' : '#1D1D1F', fontWeight: form.isUrgent ? 600 : 400 }}>
                Tandai sebagai Darurat
              </span>
            </label>
            <div style={s.formBtns}>
              <button type="button" onClick={() => setShowForm(false)} style={s.cancelBtn}>Batal</button>
              <button type="submit" disabled={saving} style={s.primaryBtn}>{saving ? 'Mengirim...' : 'Kirim'}</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? <p style={s.loading}>Memuat...</p> : (
        <div style={s.list}>
          {announcements.length === 0
            ? <p style={{ color:'#86868B', fontSize:13 }}>Belum ada pengumuman</p>
            : announcements.map(a => (
              <div key={a.id} style={{ ...s.annCard, ...(a.isUrgent ? s.annCardUrgent : {}) }}>
                <div style={s.annTop}>
                  <div style={s.annMeta}>
                    {a.isUrgent && <span style={s.urgentTag}>Darurat</span>}
                    {a.targetRole && <span style={s.targetTag}>{ROLE_LABELS[a.targetRole] ?? a.targetRole}</span>}
                    <span style={s.dateTag}>{a.createdAt?.toDate?.().toLocaleString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                  </div>
                  <button onClick={() => handleDelete(a.id, a.title)} style={s.deleteBtn}>Hapus</button>
                </div>
                <p style={s.annTitle}>{a.title}</p>
                <p style={s.annBody}>{a.body}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:       { padding:28 },
  pageHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 },
  pageTitle:  { fontSize:22, fontWeight:700, color:'#1D1D1F' },
  pageDesc:   { fontSize:13, color:'#86868B', marginTop:3 },
  primaryBtn: { padding:'8px 16px', background:'#1D1D1F', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 },
  formCard:   { background:'#fff', borderRadius:12, padding:20, marginBottom:20, border:'1px solid #E5E5EA' },
  formTitle:  { fontSize:15, fontWeight:600, color:'#1D1D1F', marginBottom:14 },
  formRow:    { display:'flex', gap:12, marginBottom:12 },
  label:      { display:'block', fontSize:11, fontWeight:600, color:'#6E6E73', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.4px' },
  input:      { width:'100%', padding:'9px 11px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' as const, color:'#1D1D1F', fontFamily:'inherit', background:'#FAFAFA' } as any,
  urgentRow:  { display:'flex', alignItems:'center', cursor:'pointer', marginBottom:14 },
  formBtns:   { display:'flex', gap:8, justifyContent:'flex-end' },
  cancelBtn:  { padding:'8px 14px', border:'1px solid #E5E5EA', borderRadius:8, cursor:'pointer', fontSize:13, background:'#fff', fontWeight:500 },
  list:       { display:'flex', flexDirection:'column', gap:10 },
  annCard:    { background:'#fff', borderRadius:12, padding:16, border:'1px solid #E5E5EA' },
  annCardUrgent: { borderLeft:'3px solid #FF3B30' },
  annTop:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 },
  annMeta:    { display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' as const },
  urgentTag:  { padding:'2px 7px', background:'#FFF2F2', color:'#FF3B30', borderRadius:4, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px' },
  targetTag:  { padding:'2px 7px', background:'#F5F5F7', color:'#6E6E73', borderRadius:4, fontSize:11, fontWeight:500 },
  dateTag:    { fontSize:11, color:'#AEAEB2' },
  annTitle:   { fontSize:14, fontWeight:600, color:'#1D1D1F', marginBottom:4 },
  annBody:    { fontSize:13, color:'#86868B', lineHeight:1.6 },
  deleteBtn:  { padding:'4px 10px', background:'#FFF2F2', color:'#FF3B30', border:'1px solid #FFCDD2', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:500, flexShrink:0 },
  loading:    { padding:20, color:'#86868B', fontSize:13 },
};
