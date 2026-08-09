import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Materials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [subjects, setSubjects]   = useState<Record<string, string>>({});
  const [users, setUsers]         = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(true);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch]       = useState('');

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
    setMaterials(mSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}"?`)) return;
    await deleteDoc(doc(db, 'materials', id));
    load();
  };

  const filtered = materials.filter(m => {
    const matchType   = !filterType || m.type === filterType;
    const matchSearch = !search || m.title?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Materi Pembelajaran</h1>
          <p style={s.pageDesc}>{materials.length} materi tersedia</p>
        </div>
      </div>

      <div style={s.filterRow}>
        <div style={s.searchWrap}>
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:15, height:15, color:'#AEAEB2', flexShrink:0 }}>
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari judul materi..." style={s.searchInput} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={s.select}>
          <option value="">Semua Tipe</option>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
        </select>
      </div>

      {loading ? <p style={s.loading}>Memuat...</p> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Judul', 'Tipe', 'Mata Pelajaran', 'Diunggah oleh', 'Aksi'].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 ? '#FAFAFA' : '#fff' }}>
                  <td style={s.td}>
                    <div style={s.titleCell}>
                      <div style={{ ...s.typeIcon, background: m.type === 'pdf' ? '#EFF6FF' : '#FFF7ED' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke={m.type === 'pdf' ? '#3B82F6' : '#F97316'} strokeWidth={1.5} style={{ width:14, height:14 }}>
                          {m.type === 'pdf'
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                          }
                        </svg>
                      </div>
                      <span style={{ fontWeight:500 }}>{m.title}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.typeBadge, background: m.type === 'pdf' ? '#EFF6FF' : '#FFF7ED', color: m.type === 'pdf' ? '#3B82F6' : '#F97316' }}>
                      {m.type?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...s.td, color:'#86868B' }}>{subjects[m.subjectId] ?? '—'}</td>
                  <td style={{ ...s.td, color:'#86868B' }}>{users[m.uploadedBy] ?? '—'}</td>
                  <td style={s.td}>
                    <div style={{ display:'flex', gap:6 }}>
                      <a href={m.fileUrl} target="_blank" rel="noreferrer" style={s.viewBtn}>Buka</a>
                      <button onClick={() => handleDelete(m.id, m.title)} style={s.deleteBtn}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ padding:20, textAlign:'center', color:'#86868B', fontSize:13 }}>Tidak ada materi</p>}
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
  tableWrap: { background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #E5E5EA' },
  table:     { width:'100%', borderCollapse:'collapse' },
  th:        { padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'#86868B', textTransform:'uppercase', letterSpacing:'0.4px', borderBottom:'1px solid #E5E5EA', background:'#FAFAFA' },
  td:        { padding:'11px 16px', fontSize:13, color:'#1D1D1F', borderBottom:'1px solid #F5F5F7' },
  titleCell: { display:'flex', alignItems:'center', gap:10 },
  typeIcon:  { width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  typeBadge: { padding:'2px 7px', borderRadius:4, fontSize:11, fontWeight:700 },
  viewBtn:   { padding:'4px 10px', background:'#F5F5F7', color:'#1D1D1F', borderRadius:5, fontSize:12, fontWeight:500, textDecoration:'none' },
  deleteBtn: { padding:'4px 10px', background:'#FFF2F2', color:'#FF3B30', border:'1px solid #FFCDD2', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:500 },
  loading:   { padding:20, color:'#86868B', fontSize:13 },
};
