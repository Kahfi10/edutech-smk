import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SectionList } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where } from '../../src/firebase/firestore.service';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function GradesScreen() {
  const { profile } = useAuth();
  const [gradeData, setGradeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [average, setAverage] = useState(0);

  useEffect(() => {
    if (!profile) return;

    Promise.all([
      getCollection('submissions', where('studentId', '==', profile.uid)),
      getCollection('assignments'),
      getCollection('subjects'),
    ]).then(([subs, assigns, subjects]) => {
      const assignMap: Record<string, any> = {};
      assigns.forEach((a: any) => (assignMap[a.id] = a));

      const subjectMap: Record<string, any> = {};
      subjects.forEach((s: any) => (subjectMap[s.id] = s));

      // Group by subject
      const grouped: Record<string, any[]> = {};
      subs.forEach((sub: any) => {
        const assign = assignMap[sub.assignmentId];
        if (!assign) return;
        const sName = subjectMap[assign.subjectId]?.name ?? 'Lainnya';
        if (!grouped[sName]) grouped[sName] = [];
        grouped[sName].push({ ...sub, assignment: assign });
      });

      const sections = Object.entries(grouped).map(([name, items]) => ({
        title: name,
        data: items,
        avg: Math.round(items.filter((i: any) => i.score != null).reduce((s: number, i: any) => s + i.score, 0) / (items.filter((i: any) => i.score != null).length || 1)),
      }));

      setGradeData(sections);

      const allScores = subs.filter((s: any) => s.score != null).map((s: any) => s.score);
      setAverage(allScores.length ? Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length) : 0);
    }).finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {/* Overall average */}
      <View style={styles.avgCard}>
        <Text style={styles.avgLabel}>Rata-rata Keseluruhan</Text>
        <Text style={[styles.avgValue, { color: average >= 75 ? '#059669' : average >= 60 ? '#D97706' : '#DC2626' }]}>
          {average}
        </Text>
        <Badge
          label={average >= 75 ? 'Baik' : average >= 60 ? 'Cukup' : 'Perlu Perhatian'}
          bg={average >= 75 ? '#ECFDF5' : average >= 60 ? '#FFFBEB' : '#FEF2F2'}
          color={average >= 75 ? '#059669' : average >= 60 ? '#D97706' : '#DC2626'}
        />
      </View>

      <SectionList
        sections={gradeData}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada nilai</Text>}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Badge label={`Avg: ${section.avg}`} bg="#EEF2FF" color="#4F46E5" />
          </View>
        )}
        renderItem={({ item }) => (
          <Card style={styles.gradeCard}>
            <View style={styles.gradeRow}>
              <Text style={styles.taskName} numberOfLines={2}>{item.assignment?.title ?? '-'}</Text>
              <View style={styles.scoreBox}>
                {item.score != null ? (
                  <>
                    <Text style={[styles.score, { color: item.score >= 75 ? '#059669' : item.score >= 60 ? '#D97706' : '#DC2626' }]}>
                      {item.score}
                    </Text>
                    <Text style={styles.maxScore}>/{item.assignment?.maxScore ?? 100}</Text>
                  </>
                ) : (
                  <Text style={styles.pending}>Belum dinilai</Text>
                )}
              </View>
            </View>
            {item.feedback ? <Text style={styles.feedback}>"{item.feedback}"</Text> : null}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  avgCard: {
    backgroundColor: '#4F46E5', margin: 16, borderRadius: 14,
    padding: 20, alignItems: 'center',
  },
  avgLabel: { fontSize: 13, color: '#C7D2FE', marginBottom: 4 },
  avgValue: { fontSize: 56, fontWeight: '800', color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, marginTop: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  gradeCard: { marginVertical: 4 },
  gradeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskName: { flex: 1, fontSize: 14, color: '#1E293B', marginRight: 8 },
  scoreBox: { flexDirection: 'row', alignItems: 'baseline' },
  score: { fontSize: 22, fontWeight: '800' },
  maxScore: { fontSize: 12, color: '#94A3B8' },
  pending: { fontSize: 12, color: '#94A3B8' },
  feedback: { fontSize: 11, color: '#64748B', marginTop: 4, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 32 },
});
