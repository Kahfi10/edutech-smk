import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Attendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const load = async () => {
      const [aSnap, sSnap] = await Promise.all([
        getDocs(collection(db, 'attendance')),
        getDocs(collection(db, 'subjects')),
      ]);
      const sMap: Record<string, string> = {};
      sSnap.docs.forEach(d => (sMap[d.id] = (d.data() as any).name));
      setSubjectMap(sMap);
      setAttendance(aSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.date?.localeCompare(a.date)));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = filterDate ? attendance.filter(a => a.date === filterDate) : attendance;

  const totalStats = filtered.reduce((acc, a) => {
    (a.records ?? []).forEach((r: any) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rekap Absensi</h1>
          <p style={styles.subtitle}>{attendance.length} sesi absensi tercatat</p>
        </div>
        <input
          type="date" value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={styles.dateInput}
        />
      </div>

      {/* Summary */}
      <div style={styles.summaryRow}>
        {Object.entries({ hadir: '#059669', izin: '#4F46E5', sakit: '#D97706', alpha: '#DC2626' }).map(([key, color]) => (
          <div key={key} style={{ ...styles.summaryCard, borderTopColor: color }}>
            <div style={{ ...styles.summaryValue, color }}>{totalStats[key] ?? 0}</div>
            <div style={styles.summaryLabel}>{key.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {loading ? <p style={{ color: '#64748B' }}>Memuat...</p> : (
        <div style={styles.list}>
          {filtered.map(a => (
            <div key={a.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.dateLabel}>📅 {a.date}</span>
                  <span style={styles.subjLabel}>📖 {subjectMap[a.subjectId] ?? a.subjectId}</span>
                  <span style={styles.periodLabel}>Jam ke-{a.period}</span>
                </div>
                <span style={styles.totalLabel}>{a.records?.length ?? 0} siswa</span>
              </div>
              <div style={styles.recordsRow}>
                {['hadir', 'izin', 'sakit', 'alpha'].map(status => {
                  const count = a.records?.filter((r: any) => r.status === status).length ?? 0;
                  const colors: Record<string, string> = { hadir: '#059669', izin: '#4F46E5', sakit: '#D97706', alpha: '#DC2626' };
                  return count > 0 ? (
                    <span key={status} style={{ ...styles.recordBadge, color: colors[status], backgroundColor: colors[status] + '18' }}>
                      {status}: {count}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>Tidak ada data absensi</p>}
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
  dateInput: { padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none' },
  summaryRow: { display: 'flex', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, borderTop: '3px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', textAlign: 'center' },
  summaryValue: { fontSize: 28, fontWeight: 800 },
  summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: 700, marginTop: 2 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 },
  dateLabel: { marginRight: 12, fontSize: 13, color: '#1E293B', fontWeight: 600 },
  subjLabel: { marginRight: 12, fontSize: 13, color: '#4F46E5' },
  periodLabel: { fontSize: 12, color: '#94A3B8' },
  totalLabel: { fontSize: 13, fontWeight: 700, color: '#64748B' },
  recordsRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  recordBadge: { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 },
};
