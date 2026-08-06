import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Materials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  const load = async () => {
    const [mSnap, sSnap, uSnap] = await Promise.all([
      getDocs(collection(db, 'materials')),
      getDocs(collection(db, 'subjects')),
      getDocs(collection(db, 'users')),
    ]);
    const sMap: Record<string, string> = {};
    sSnap.docs.forEach(d => (sMap[d.id] = (d.data() as any).name));
    const uMap: Record<string, string> = {};
    uSnap.docs.forEach(d => (uMap[d.id] = (d.data() as any).name));
    setSubjects(sMap); setUsers(uMap);
    setMaterials(mSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus materi "${title}"?`)) return;
    await deleteDoc(doc(db, 'materials', id));
    load();
  };

  const filtered = filterType ? materials.filter(m => m.type === filterType) : materials;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manajemen Materi</h1>
          <p style={styles.subtitle}>{materials.length} materi tersedia</p>
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={styles.select}>
          <option value="">Semua Tipe</option>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
        </select>
      </div>

      {loading ? <p style={{ color: '#64748B' }}>Memuat...</p> : (
        <div style={styles.grid}>
          {filtered.map(m => (
            <div key={m.id} style={styles.card}>
              <div style={styles.cardTop}>
                <span style={{ fontSize: 32 }}>{m.type === 'pdf' ? '📄' : '🎥'}</span>
                <div style={{ flex: 1 }}>
                  <div style={styles.cardTitle}>{m.title}</div>
                  <div style={styles.cardMeta}>
                    <span style={{ ...styles.badge, backgroundColor: m.type === 'pdf' ? '#EEF2FF' : '#FEF3C7', color: m.type === 'pdf' ? '#4F46E5' : '#92400E' }}>
                      {m.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              {m.description && <p style={styles.cardDesc}>{m.description}</p>}
              <div style={styles.cardInfo}>
                <span>📖 {subjects[m.subjectId] ?? '-'}</span>
                <span>👤 {users[m.uploadedBy] ?? '-'}</span>
              </div>
              <div style={styles.cardActions}>
                <a href={m.fileUrl} target="_blank" rel="noreferrer" style={styles.viewBtn}>🔗 Buka File</a>
                <button onClick={() => handleDelete(m.id, m.title)} style={styles.deleteBtn}>Hapus</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ color: '#94A3B8' }}>Belum ada materi</p>}
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
  select: { padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#1E293B' },
  cardMeta: { display: 'flex', gap: 6, marginTop: 4 },
  badge: { padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 },
  cardDesc: { fontSize: 13, color: '#64748B', margin: '6px 0' },
  cardInfo: { display: 'flex', gap: 12, fontSize: 12, color: '#94A3B8', marginBottom: 10 },
  cardActions: { display: 'flex', gap: 8 },
  viewBtn: { flex: 1, padding: '6px 0', backgroundColor: '#EEF2FF', color: '#4F46E5', textDecoration: 'none', textAlign: 'center', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
};
