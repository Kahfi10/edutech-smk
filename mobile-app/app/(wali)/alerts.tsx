import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, updateDocument, where } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

export default function WaliAlertsScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.classId) { setLoading(false); return; }
    Promise.all([
      getCollection('users', where('role', '==', 'STUDENT'), where('classId', '==', profile.classId)),
      getCollection('attendance'),
      getCollection('submissions'),
      getCollection('violations'),
    ]).then(([students, attendance, submissions, violations]) => {
      const detected: any[] = [];
      for (const s of students as any[]) {
        const alphas = (attendance as any[]).filter(a =>
          a.records?.some((r: any) => r.studentId === s.uid && r.status === 'alpha')
        ).length;
        if (alphas > 3) detected.push({
          studentId: s.uid, studentName: s.name, type: 'alpha',
          detail: `Alpha ${alphas}x — Ambang batas terlampaui (>3x)`, severity: 'high',
        });
        const mySubs = (submissions as any[]).filter(x => x.studentId === s.uid && x.score != null);
        if (mySubs.length >= 4) {
          const recent = mySubs.slice(-2).reduce((n: number, x: any) => n + x.score, 0) / 2;
          const prev   = mySubs.slice(-4, -2).reduce((n: number, x: any) => n + x.score, 0) / 2;
          if (prev - recent > 20) detected.push({
            studentId: s.uid, studentName: s.name, type: 'grade_drop',
            detail: `Nilai turun ${Math.round(prev - recent)} poin (${Math.round(prev)} → ${Math.round(recent)})`, severity: 'high',
          });
        }
        const pts = (violations as any[]).filter(v => v.studentId === s.uid && v.status === 'verified')
          .reduce((n: number, v: any) => n + (v.points ?? 0), 0);
        if (pts >= 80) detected.push({
          studentId: s.uid, studentName: s.name, type: 'violation',
          detail: `Poin pelanggaran: ${pts}/100 — Mendekati batas!`, severity: 'high',
        });
      }
      setAlerts(detected);
    }).finally(() => setLoading(false));
  }, [profile]);

  const TYPE_ICON: Record<string, string> = { alpha: 'calendar-outline', grade_drop: 'trending-down-outline', violation: 'warning-outline' };
  const TYPE_LABEL: Record<string, string> = { alpha: 'Absensi', grade_drop: 'Nilai', violation: 'Pelanggaran' };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Alert System</Text>
        <Text style={styles.headerSub}>{alerts.length} siswa perlu perhatian</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Semua siswa baik</Text>
            <Text style={styles.emptySub}>Tidak ada alert saat ini</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={TYPE_ICON[item.type] as any} size={20} color={Colors.gray3} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.cardTop}>
                <Text style={styles.studentName}>{item.studentName}</Text>
                <View style={styles.typePill}>
                  <Text style={styles.typeText}>{TYPE_LABEL[item.type]}</Text>
                </View>
              </View>
              <Text style={styles.detail}>{item.detail}</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  headerTitle: { ...Typography.title2, color: Colors.white },
  headerSub: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  list: { padding: Spacing.base },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    ...Shadow.sm,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.gray11, alignItems: 'center', justifyContent: 'center',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  studentName: { ...Typography.headline, color: Colors.black, flex: 1 },
  typePill: {
    backgroundColor: Colors.gray11, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  typeText: { ...Typography.caption1, color: Colors.gray4, fontWeight: '600' },
  detail: { ...Typography.footnote, color: Colors.secondaryLabel },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
  emptySub: { ...Typography.subheadline, color: Colors.tertiaryLabel },
});
