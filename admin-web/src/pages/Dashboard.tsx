import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const StatCard = ({ label, value, sub }: { label: string; value: number; sub?: string }) => (
  <div style={s.statCard}>
    <p style={s.statValue}>{value}</p>
    <p style={s.statLabel}>{label}</p>
    {sub && <p style={s.statSub}>{sub}</p>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ users:0, students:0, teachers:0, materials:0, assignments:0, submissions:0, violations:0, counselings:0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, materials, assignments, submissions, violations, counselings, anns] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'materials')),
          getDocs(collection(db, 'assignments')),
          getDocs(collection(db, 'submissions')),
          getDocs(collection(db, 'violations')),
          getDocs(collection(db, 'counseling')),
          getDocs(collection(db, 'announcements')),
        ]);
        const usersData = users.docs.map(d => d.data());
        setStats({
          users: usersData.length,
          students: usersData.filter(u => u.role === 'STUDENT').length,
          teachers: usersData.filter(u => u.role === 'TEACHER').length,
          materials: materials.size,
          assignments: assignments.size,
          submissions: submissions.size,
          violations: violations.size,
          counselings: counselings.size,
        });
        setAnnouncements(
          anns.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.())
            .slice(0, 5)
        );
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div style={s.loading}>Memuat...</div>;

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Dashboard</h1>
        <p style={s.pageDesc}>Ringkasan data sekolah hari ini</p>
      </div>

      {/* Stats grid */}
      <div style={s.statsGrid}>
        <StatCard label="Total Pengguna"  value={stats.users}      sub={`${stats.students} siswa · ${stats.teachers} guru`} />
        <StatCard label="Materi"          value={stats.materials} />
        <StatCard label="Tugas"           value={stats.assignments} />
        <StatCard label="Submissions"     value={stats.submissions} />
        <StatCard label="Pelanggaran"     value={stats.violations} />
        <StatCard label="Konseling"       value={stats.counselings} />
      </div>

      {/* Announcements */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Pengumuman Terbaru</h2>
        {announcements.length === 0
          ? <p style={s.empty}>Belum ada pengumuman</p>
          : (
            <div style={s.annList}>
              {announcements.map((a: any) => (
                <div key={a.id} style={{ ...s.annRow, ...(a.isUrgent ? s.annRowUrgent : {}) }}>
                  <div style={s.annLeft}>
                    {a.isUrgent && <span style={s.urgentTag}>Darurat</span>}
                    <p style={s.annTitle}>{a.title}</p>
                    <p style={s.annBody}>{a.body}</p>
                  </div>
                  <span style={s.annDate}>{a.createdAt?.toDate?.().toLocaleDateString('id-ID', { day:'numeric', month:'short' })}</span>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:       { padding:28, maxWidth:960 },
  pageHeader: { marginBottom:24 },
  pageTitle:  { fontSize:22, fontWeight:700, color:'#1D1D1F' },
  pageDesc:   { fontSize:13, color:'#86868B', marginTop:3 },
  statsGrid: {
    display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))',
    gap:12, marginBottom:28,
  },
  statCard: {
    background:'#fff', borderRadius:12, padding:'16px 18px',
    border:'1px solid #E5E5EA',
  },
  statValue: { fontSize:28, fontWeight:700, color:'#1D1D1F', lineHeight:1 },
  statLabel: { fontSize:12, color:'#86868B', marginTop:6, fontWeight:500 },
  statSub:   { fontSize:11, color:'#AEAEB2', marginTop:3 },
  section:   { },
  sectionTitle: { fontSize:15, fontWeight:600, color:'#1D1D1F', marginBottom:12 },
  annList:   { border:'1px solid #E5E5EA', borderRadius:12, overflow:'hidden', background:'#fff' },
  annRow: {
    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
    padding:'14px 16px', borderBottom:'1px solid #F5F5F7',
  },
  annRowUrgent: { borderLeft:'3px solid #FF3B30' },
  annLeft:   { flex:1, marginRight:12 },
  urgentTag: {
    display:'inline-block', fontSize:10, fontWeight:700, color:'#FF3B30',
    background:'#FFF2F2', padding:'2px 6px', borderRadius:4, marginBottom:4,
    textTransform:'uppercase', letterSpacing:'0.4px',
  },
  annTitle: { fontSize:13, fontWeight:600, color:'#1D1D1F' },
  annBody:  { fontSize:12, color:'#86868B', marginTop:3 },
  annDate:  { fontSize:11, color:'#AEAEB2', flexShrink:0, paddingTop:1 },
  empty:    { color:'#86868B', fontSize:13 },
  loading:  { padding:28, color:'#86868B', fontSize:13 },
};
