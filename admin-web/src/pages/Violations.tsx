import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Violations() {
  const [violations, setViolations] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    const [vSnap, uSnap] = await Promise.all([
      getDocs(collection(db, 'violations')),
      getDocs(collection(db, 'users')),
    ]);
    const uMap: Record<string, string> = {};
    uSnap.docs.forEach(d => (uMap[d.id] = (d.data() as any).name));
    setUserMap(uMap);
    setViolations(vSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.date?.toDate?.() - a.date?.toDate?.()));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'violations', id), { status });
    load();
  };

  const filtered = filterStatus ? violations.filter(v => v.status === filterStatus) : violations;

  const totalPoints = violations.reduce((sum, v) => sum + (v.status === 'verified' ? (v.points ?? 0) : 0), 0);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rekap Pelanggaran</h1>
          <p style={styles.subtitle}>{violations.length} catatan | {totalPoints} total poin terverifikasi</p>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.select}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Terverifikasi</option>
        </select>
      </div>

      {loading ? <p style={{ color: '#64748B' }}>Memuat...</p> : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {['Siswa', 'Kategori', 'Deskripsi', 'Poin', 'Status', 'Tanggal', 'Aksi'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} style={styles.tr}>
                  <td style={styles.td}>{userMap[v.studentId] ?? v.studentId}</td>
                  <td style={{ ...styles.td, color: '#4F46E5', fontWeight: 600 }}>{v.category}</td>
                  <td style={{ ...styles.td, color: '#64748B', fontSize: 13 }}>{v.description}</td>
                  <td style={{ ...styles.td, color: '#DC2626', fontWeight: 800 }}>+{v.points}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, ...(v.status === 'verified' ? styles.statusVerified : styles.statusPending) }}>
                      {v.status === 'verified' ? '✅ Verified' : '⏳ Pending'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontSize: 12, color: '#94A3B8' }}>{v.date?.toDate?.().toLocaleDateString('id-ID')}</td>
                  <td style={styles.td}>
                    {v.status === 'pending' && (
                      <button onClick={() => updateStatus(v.id, 'verified')} style={styles.verifyBtn}>Verifikasi</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>Tidak ada data</p>}
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
  tableWrapper: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'auto', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  thead: { backgroundColor: '#F8FAFC' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '11px 14px', fontSize: 14, color: '#1E293B', verticalAlign: 'middle' },
  statusBadge: { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 },
  statusVerified: { backgroundColor: '#ECFDF5', color: '#059669' },
  statusPending: { backgroundColor: '#FFFBEB', color: '#D97706' },
  verifyBtn: { padding: '5px 10px', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
};
