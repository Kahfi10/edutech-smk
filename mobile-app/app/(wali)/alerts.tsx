import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where } from '../../src/firebase/firestore.service';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

interface AlertItem {
  studentId: string;
  studentName: string;
  type: 'alpha' | 'grade_drop' | 'violation';
  detail: string;
  severity: 'high' | 'medium';
}

export default function WaliAlertsScreen() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.classId) { setLoading(false); return; }

    Promise.all([
      getCollection('users', where('role', '==', 'STUDENT'), where('classId', '==', profile.classId)),
      getCollection('attendance'),
      getCollection('submissions'),
      getCollection('violations'),
    ]).then(([students, attendance, submissions, violations]) => {
      const detectedAlerts: AlertItem[] = [];

      for (const student of (students as any[])) {
        // 1. Alpha > 3x
        const alphas = (attendance as any[]).filter(a =>
          a.records?.some((r: any) => r.studentId === student.uid && r.status === 'alpha')
        ).length;
        if (alphas > 3) {
          detectedAlerts.push({
            studentId: student.uid,
            studentName: student.name,
            type: 'alpha',
            detail: `Alpha ${alphas}x — Ambang batas terlampaui (>3x)`,
            severity: 'high',
          });
        }

        // 2. Nilai drop >20%
        const mySubs = (submissions as any[])
          .filter(s => s.studentId === student.uid && s.score != null)
          .sort((a: any, b: any) => a.submittedAt?.toDate?.() - b.submittedAt?.toDate?.());
        if (mySubs.length >= 4) {
          const recent = mySubs.slice(-2).reduce((s: number, x: any) => s + x.score, 0) / 2;
          const prev = mySubs.slice(-4, -2).reduce((s: number, x: any) => s + x.score, 0) / 2;
          const drop = prev - recent;
          if (drop > 20) {
            detectedAlerts.push({
              studentId: student.uid,
              studentName: student.name,
              type: 'grade_drop',
              detail: `Nilai turun ${Math.round(drop)} poin (${Math.round(prev)} → ${Math.round(recent)})`,
              severity: 'high',
            });
          }
        }

        // 3. Poin pelanggaran mendekati max (>=80 dari 100)
        const totalPoints = (violations as any[])
          .filter(v => v.studentId === student.uid && v.status === 'verified')
          .reduce((sum: number, v: any) => sum + (v.points ?? 0), 0);
        if (totalPoints >= 80) {
          detectedAlerts.push({
            studentId: student.uid,
            studentName: student.name,
            type: 'violation',
            detail: `Poin pelanggaran: ${totalPoints}/100 — Mendekati batas maksimum!`,
            severity: 'high',
          });
        }
      }

      setAlerts(detectedAlerts);
    }).finally(() => setLoading(false));
  }, [profile]);

  const ICON: Record<string, string> = { alpha: '📅', grade_drop: '📉', violation: '⚠️' };
  const LABEL: Record<string, string> = { alpha: 'Absensi', grade_drop: 'Nilai', violation: 'Pelanggaran' };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alert System Cerdas</Text>
        <Text style={styles.headerSub}>{alerts.length} siswa perlu perhatian</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>Semua siswa dalam kondisi baik!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.alertCard, item.severity === 'high' && styles.alertHigh]}>
            <View style={styles.alertTop}>
              <Text style={styles.alertIcon}>{ICON[item.type]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertName}>{item.studentName}</Text>
                <Text style={styles.alertDetail}>{item.detail}</Text>
              </View>
              <Badge label={LABEL[item.type]} bg="#FEF2F2" color="#DC2626" />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#DC2626', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#FCA5A5', marginTop: 2 },
  list: { padding: 16 },
  alertCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8,
    borderLeftWidth: 4, borderLeftColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  alertHigh: { borderLeftColor: '#DC2626' },
  alertTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  alertIcon: { fontSize: 24 },
  alertName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  alertDetail: { fontSize: 12, color: '#64748B', marginTop: 3 },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#64748B' },
});
