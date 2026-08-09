import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Attendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch]         = useState('');

  useEffect(() => {
    const load = async () => {
      const [aSnap, sSnap] = await Promise.all([
        getDocs(collection(db, 'attendance')),
        getDocs(collection(db, 'subjects')),
      ]);
      const sMap: Record<string, string> = {};
      sSnap.docs.forEach(d => (sMap[d.id] = (d.data() as any).name));
      setSubjectMap(sMap);
      setAttendance(aSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => b.date?.localeCompare(a.date)));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = attendance.filter(a => {
    const matchDate   = !filterDate || a.date === filterDate;
    const matchSearch = !search || subjectMap[a.subjectId]?.toLowerCase().includes(search.toLowerCase());
    return matchDate && matchSearch;
  });

  const summary = filtered.reduce((acc, a) => {
    (a.records ?? []).forEach((r: any) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const SUMMARY_CONFIG = [
    { key:'hadir',  label:'Hadir',  color:'#16A34A', bg:'#F0FDF4' },
    { key:'izin',   label:'Izin',   color:'#2563EB', bg:'#EFF6FF' },
    { key:'sakit',  label:'Sakit',  color:'#D97706', bg:'#FFFBEB' },
    { key:'alpha',  label:'Alpha',  color:'#DC2626', bg:'#FFF2F2' },
  ];

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Rekap Absensi</h1>
          <p style={s.pageDesc}>{attendance.length} sesi tercatat</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={s.summaryRow}>
        {SUMMARY_CONFIG.map(c => (
          <div key={c.key} style={{ ...s.summaryCard, background: c.bg }}>
            <p style={{ ...s.summaryVal, color: c.color }}>{summary[c.key] ?? 0}</p>
            <p style={{ ...s.summaryLabel, color: c.color }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        <div style={s.searchWrap}>
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width:15, height:15, color:'#AEAEB2', flexShrink:0 }}>
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari mata pelajaran..." style={s.searchInput} />
        </div>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={s.dateInput} />
        {filterDate && <button onClick={() => setFilterDate('')} style={s.clearBtn}>Reset</button>}
      </div>

      {loading ? <p style={s.loading}>Memuat...</p> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Tanggal', 'Mata Pelajaran', 'Jam ke-', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total'].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const counts = (a.records ?? []).reduce((acc: any, r: any) => {
                  acc[r.status] = (acc[r.status] ?? 0) + 1;
                  return acc;
                }, {});
                const total = (a.records ?? []).length;
                return (
                  <tr key={a.id} style={{ background: i % 2 ? '#FAFAFA' : '#fff' }}>
                    <td style={{ ...s.td, fontWeight:500, whiteSpace:'nowrap' as const }}>{a.date}</td>
                    <td style={s.td}>{subjectMap[a.subjectId] ?? a.subjectId}</td>
                    <td style={{ ...s.td, textAlign:'center' as const }}>{a.period}</td>
                    <td style={{ ...s.td, textAlign:'center' as const, color:'#16A34A', fontWeight:600 }}>{counts.hadir ?? 0}</td>
                    <td style={{ ...s.td, textAlign:'center' as const, color:'#2563EB', fontWeight:600 }}>{counts.izin ?? 0}</td>
                    <td style={{ ...s.td, textAlign:'center' as const, color:'#D97706', fontWeight:600 }}>{counts.sakit ?? 0}</td>
                    <td style={{ ...s.td, textAlign:'center' as const, color:'#DC2626', fontWeight:600 }}>{counts.alpha ?? 0}</td>
                    <td style={{ ...s.td, textAlign:'center' as const, color:'#86868B' }}>{total}</td>
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
  page:       { padding:28 },
  pageHeader: { marginBottom:20 },
  pageTitle:  { fontSize:22, fontWeight:700, color:'#1D1D1F' },
  pageDesc:   { fontSize:13, color:'#86868B', marginTop:3 },
  summaryRow: { display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' as const },
  summaryCard:{ flex:1, minWidth:110, borderRadius:10, padding:'12px 16px' },
  summaryVal: { fontSize:28, fontWeight:700, lineHeight:1 },
  summaryLabel:{ fontSize:12, fontWeight:600, marginTop:5, textTransform:'uppercase' as const, letterSpacing:'0.3px' },
  filterRow:  { display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' as const },
  searchWrap: { display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #E5E5EA', borderRadius:8, padding:'7px 12px', flex:1, minWidth:200 },
  searchInput:{ border:'none', outline:'none', fontSize:13, flex:1, color:'#1D1D1F', background:'transparent' },
  dateInput:  { padding:'8px 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, outline:'none', background:'#fff', color:'#1D1D1F', cursor:'pointer' },
  clearBtn:   { padding:'8px 12px', background:'#F5F5F7', border:'1px solid #E5E5EA', borderRadius:8, cursor:'pointer', fontSize:13, color:'#86868B', fontWeight:500 },
  tableWrap:  { background:'#fff', borderRadius:12, overflow:'auto', border:'1px solid #E5E5EA' },
  table:      { width:'100%', borderCollapse:'collapse', minWidth:600 },
  th:         { padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'#86868B', textTransform:'uppercase', letterSpacing:'0.4px', borderBottom:'1px solid #E5E5EA', background:'#FAFAFA', whiteSpace:'nowrap' },
  td:         { padding:'11px 16px', fontSize:13, color:'#1D1D1F', borderBottom:'1px solid #F5F5F7' },
  loading:    { padding:20, color:'#86868B', fontSize:13 },
};
