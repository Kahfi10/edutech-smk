import React, { useEffect, useState } from 'react';
import { collection, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Stats {
  users: number;
  students: number;
  teachers: number;
  materials: number;
  assignments: number;
  submissions: number;
  violations: number;
  counselings: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0, students: 0, teachers: 0, materials: 0,
    assignments: 0, submissions: 0, violations: 0, counselings: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, materials, assignments, submissions, violations, counselings, announcements] = await Promise.all([
          getDocs(collection(db, 'users')),
          getCountFromServer(collection(db, 'materials')),
          getCountFromServer(collection(db, 'assignments')),
          getCountFromServer(collection(db, 'submissions')),
          getCountFromServer(collection(db, 'violations')),
          getCountFromServer(collection(db, 'counseling')),
          getDocs(collection(db, 'announcements')),
        ]);

        const usersData = users.docs.map(d => d.data());
        setStats({
          users: usersData.length,
          students: usersData.filter(u => u.role === 'STUDENT').length,
          teachers: usersData.filter(u => u.role === 'TEACHER').length,
          materials: materials.data().count,
          assignments: assignments.data().count,
          submissions: submissions.data().count,
          violations: violations.data().count,
          counselings: counselings.data().count,
        });

        const ann = announcements.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.())
          .slice(0, 5);
        setRecentAnnouncements(ann);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={styles.loading}>Memuat dashboard...</div>;

  const statCards = [
    { label: 'Total User', value: stats.users, color: '#4F46E5', icon: '👤' },
    { label: 'Siswa', value: stats.students, color: '#059669', icon: '🎒' },
    { label: 'Guru', value: stats.teachers, color: '#D97706', icon: '👨‍🏫' },
    { label: 'Materi', value: stats.materials, color: '#7C3AED', icon: '📚' },
    { label: 'Tugas', value: stats.assignments, color: '#0891B2', icon: '📝' },
    { label: 'Submissions', value: stats.submissions, color: '#DC2626', icon: '📤' },
    { label: 'Pelanggaran', value: stats.violations, color: '#EA580C', icon: '⚠️' },
    { label: 'Konseling', value: stats.counselings, color: '#DB2777', icon: '💬' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard Admin</h1>
        <p style={styles.subtitle}>Selamat datang di Admin Portal EduTech SMK</p>
      </div>

      <div style={styles.statsGrid}>
        {statCards.map(s => (
          <div key={s.label} style={{ ...styles.statCard, borderTopColor: s.color }}>
            <div style={styles.statIcon}>{s.icon}</div>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Pengumuman Terbaru</h2>
        {recentAnnouncements.length === 0 ? (
          <p style={styles.empty}>Belum ada pengumuman</p>
        ) : (
          <div style={styles.announcementList}>
            {recentAnnouncements.map((a: any) => (
              <div key={a.id} style={{ ...styles.announcementCard, ...(a.isUrgent ? styles.announcementUrgent : {}) }}>
                {a.isUrgent && <span style={styles.urgentBadge}>🚨 URGENT</span>}
                <div style={styles.annTitle}>{a.title}</div>
                <div style={styles.annBody}>{a.body}</div>
                <div style={styles.annMeta}>{a.createdAt?.toDate?.().toLocaleDateString('id-ID')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, maxWidth: 1200 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 800, color: '#1E293B', margin: 0 },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 32 },
  statCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderTopWidth: 3, borderTopStyle: 'solid',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: 800 },
  statLabel: { fontSize: 13, color: '#64748B', marginTop: 3 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#1E293B', marginBottom: 14 },
  announcementList: { display: 'flex', flexDirection: 'column', gap: 10 },
  announcementCard: {
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14,
    borderLeft: '4px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  announcementUrgent: { borderLeftColor: '#DC2626' },
  urgentBadge: { fontSize: 11, color: '#DC2626', fontWeight: 700, display: 'block', marginBottom: 4 },
  annTitle: { fontSize: 15, fontWeight: 700, color: '#1E293B' },
  annBody: { fontSize: 13, color: '#64748B', marginTop: 4 },
  annMeta: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  empty: { color: '#94A3B8' },
  loading: { padding: 24, color: '#64748B' },
};
