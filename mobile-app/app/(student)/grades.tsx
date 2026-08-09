import React, { useEffect, useState } from 'react';
import {
  View, Text, SectionList, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { USE_MOCK } from '../../src/constants/mockData';

const MOCK_GRADES = [
  {
    title: 'Pemrograman Web',
    avg: 88,
    data: [
      { id: '1', assignment: { title: 'Tugas 1 — HTML & CSS' }, score: 90, maxScore: 100, feedback: 'Sangat baik!' },
      { id: '2', assignment: { title: 'Tugas 2 — JavaScript' }, score: 85, maxScore: 100, feedback: null },
    ],
  },
  {
    title: 'Basis Data',
    avg: 78,
    data: [
      { id: '3', assignment: { title: 'Tugas 1 — ERD' }, score: 78, maxScore: 100, feedback: 'Perlu diperbaiki di bagian normalisasi.' },
    ],
  },
];

export default function GradesScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<any[]>([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      setSections(MOCK_GRADES);
      const all = MOCK_GRADES.flatMap(s => s.data).map(d => d.score).filter(Boolean);
      setAverage(all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0);
      setLoading(false);
      return;
    }
    if (!profile) return;
    Promise.all([
      getCollection('submissions', where('studentId', '==', profile.uid)),
      getCollection('assignments'),
      getCollection('subjects'),
    ]).then(([subs, assigns, subjects]) => {
      const assignMap: Record<string, any> = {};
      (assigns as any[]).forEach(a => (assignMap[a.id] = a));
      const subjectMap: Record<string, any> = {};
      (subjects as any[]).forEach(s => (subjectMap[s.id] = s));

      const grouped: Record<string, any[]> = {};
      (subs as any[]).forEach(sub => {
        const assign = assignMap[sub.assignmentId];
        if (!assign) return;
        const sName = subjectMap[assign.subjectId]?.name ?? 'Lainnya';
        if (!grouped[sName]) grouped[sName] = [];
        grouped[sName].push({ ...sub, assignment: assign });
      });

      const sec = Object.entries(grouped).map(([title, data]) => ({
        title,
        data,
        avg: Math.round(
          (data as any[]).filter(d => d.score != null).reduce((s, d) => s + d.score, 0) /
          (Math.max((data as any[]).filter(d => d.score != null).length, 1))
        ),
      }));
      setSections(sec);

      const allScores = (subs as any[]).filter(s => s.score != null).map((s: any) => s.score);
      setAverage(allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0);
    }).finally(() => setLoading(false));
  }, [profile]);

  const gradeLabel = (n: number) => n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : n >= 60 ? 'D' : 'E';

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      sections={sections}
      keyExtractor={item => item.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={() => (
        /* Overall average banner */
        <View style={[styles.avgBanner, { paddingTop: insets.top + 16 }]}>
          <View>
            <Text style={styles.avgLabel}>Rata-rata Keseluruhan</Text>
            <View style={styles.avgRow}>
              <Text style={styles.avgValue}>{average}</Text>
              <Text style={styles.avgGrade}>{gradeLabel(average)}</Text>
            </View>
          </View>
          <View style={styles.avgCircle}>
            <Ionicons name="star" size={28} color={Colors.white} />
          </View>
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={styles.empty}>
          <Ionicons name="star-outline" size={44} color={Colors.gray8} />
          <Text style={styles.emptyText}>Belum ada nilai</Text>
        </View>
      )}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionAvgPill}>
            <Text style={styles.sectionAvgText}>Avg {section.avg}</Text>
          </View>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.gradeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskName} numberOfLines={1}>{item.assignment?.title ?? '-'}</Text>
            {item.feedback ? (
              <Text style={styles.feedback} numberOfLines={1}>"{item.feedback}"</Text>
            ) : null}
          </View>
          <View style={styles.scoreArea}>
            {item.score != null ? (
              <>
                <Text style={styles.score}>{item.score}</Text>
                <Text style={styles.maxScore}>/{item.assignment?.maxScore ?? 100}</Text>
              </>
            ) : (
              <Text style={styles.pending}>—</Text>
            )}
          </View>
        </View>
      )}
      SectionSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      ItemSeparatorComponent={() => (
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: Spacing.base + 16 }} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  avgBanner: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avgLabel: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  avgRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  avgValue: { fontSize: 52, fontWeight: '800', color: Colors.white, letterSpacing: -1 },
  avgGrade: { fontSize: 28, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  avgCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, marginBottom: Spacing.xs,
  },
  sectionTitle: { ...Typography.footnote, color: Colors.tertiaryLabel, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionAvgPill: {
    backgroundColor: Colors.gray11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full,
  },
  sectionAvgText: { ...Typography.caption1, color: Colors.gray5, fontWeight: '600' },

  gradeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    backgroundColor: Colors.cardBackground,
    gap: 10,
  },
  taskName: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  feedback: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  scoreArea: { flexDirection: 'row', alignItems: 'baseline' },
  score: { fontSize: 22, fontWeight: '800', color: Colors.black },
  maxScore: { ...Typography.caption1, color: Colors.tertiaryLabel, marginLeft: 1 },
  pending: { ...Typography.body, color: Colors.gray8 },

  empty: { alignItems: 'center', paddingVertical: 56, gap: 10 },
  emptyText: { ...Typography.subheadline, color: Colors.tertiaryLabel },
});
