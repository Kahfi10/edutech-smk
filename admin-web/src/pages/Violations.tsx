import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Violations() {
  const [violations, setViolations] = useState<any[]>([]);
  const [userMap, setUserMap]       = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('');
  const [search, setSearch]         = useState('');

  const load = async () => {
    const [vSnap, uSnap] = await Promise.all([
      getDocs(collection(db, 'violations')),
      getDocs(collection(db, 'users')),
    ]);
    const uMap: Record<string, string> = {};
    uSnap.docs.forEach(d => (uMap[d.id] = (d.data() as any).name));
    setUserMap(uMap);
    setViolations(vSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => b.date?.toDate?.() - a.date?.toDate?.()));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'violations', id), { status });
    load();
  };

  const filtered = violations.filter(v => {
    const matchFilter = !filter || v.status === filter;
    const matchSearch = !search || userMap[v.studentId]?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalVerified = violations.filter(v => v.status === 'verified').reduce((s, v: any) => s + (v.points ?? 0), 0);

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    verified: { bg:'#FFF2F2', color:'#FF3B30' },
    pending:  { bg:'#FFF8EC', color:'#FF9500' },
    rejected: { bg:'#F5F5F7', color:'#86868B' },
  };

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Pelanggaran</h1>
          <p style={s.pageDesc}>{violations.length} catatan · {totalVerified} poin terverifikasi</p>
        </div>
      </div>

      <div style={s.filterRow}>
        <div style={s.searchWrap}>
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:15, height:15, color:'#AEAEB2', flexShrink:0 }}>
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama siswa..." style={s.searchInput} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={s.select}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      {loading ? <p style={s.loading}>Memuat...</p> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Siswa', 'Kategori', 'Deskripsi', 'Poin', 'Status', 'Tanggal', 'Aksi'].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const ss = STATUS_STYLE[v.status] ?? STATUS_STYLE.pending;
                return (
                  <tr key={v.id} style={{ background: i % 2 ? '#FAFAFA' : '#fff' }}>
                    <td style={{ ...s.td, fontWeight:500 }}>{userMap[v.studentId] ?? v.studentId}</td>
                    <td style={{ ...s.td, color:'#86868B' }}>{v.category}</td>
                    <td style={{ ...s.td, color:'#86868B', maxWidth:200 }}>
                      <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.description}</span>
                    </td>
                    <td style={{ ...s.td, fontWeight:700, color:'#FF3B30' }}>+{v.points}</td>
                    <td style={s.td}>
                      <span style={{ ...s.statusBadge, background: ss.bg, color: ss.color }}>
                        {v.status === 'verified' ? 'Verified' : v.status === 'pending' ? 'Pending' : 'Ditolak'}
                      </span>
                    </td>
                    <td style={{ ...s.td, color:'#86868B', whiteSpace:'nowrap' as const }}>
                      {v.date?.toDate?.().toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                    </td>
                    <td style={s.td}>
                      {v.status === 'pending' && (
                        <button onClick={() => updateStatus(v.id, 'verified')} style={s.verifyBtn}>Verifikasi</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ padding:20, textAlign:'center', color:'#86868B', fontSize:13 }}>Tidak ada data</p>}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:      { padding:28 },
  pageHeader:{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 },
  pageTitle: { fontSize:22, fontWeight:700, color:'#1D1D1F' },
  pageDesc:  { fontSize:13, color:'#86868B', marginTop:3 },
  filterRow: { display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' as const },
  searchWrap:{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #E5E5EA', borderRadius:8, padding:'7px 12px', flex:1, minWidth:200 },
  searchInput:{ border:'none', outline:'none', fontSize:13, flex:1, color:'#1D1D1F', background:'transparent' },
  select:    { padding:'8px 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, outline:'none', background:'#fff', color:'#1D1D1F', cursor:'pointer' },
  tableWrap: { background:'#fff', borderRadius:12, overflow:'auto', border:'1px solid #E5E5EA' },
  table:     { width:'100%', borderCollapse:'collapse', minWidth:700 },
  th:        { padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'#86868B', textTransform:'uppercase', letterSpacing:'0.4px', borderBottom:'1px solid #E5E5EA', background:'#FAFAFA', whiteSpace:'nowrap' },
  td:        { padding:'11px 16px', fontSize:13, color:'#1D1D1F', borderBottom:'1px solid #F5F5F7' },
  statusBadge:{ padding:'3px 8px', borderRadius:5, fontSize:11, fontWeight:600 },
  verifyBtn: { padding:'4px 10px', background:'#F0FDF4', color:'#16A34A', border:'1px solid #BBF7D0', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:600 },
  loading:   { padding:20, color:'#86868B', fontSize:13 },
};
