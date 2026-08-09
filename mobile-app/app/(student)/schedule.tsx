import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { USE_MOCK } from '../../src/constants/mockData';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const TODAY_IDX = Math.min(Math.max(new Date().getDay() - 1, 0), 4); // 0=Senin

// Mock schedule data
const MOCK_SCHEDULE = [
  { day: 0, period: 1, subject: 'Pemrograman Web',   teacher: 'Budi Santoso', room: 'Lab Komputer 1', start: '07:00', end: '07:45' },
  { day: 0, period: 2, subject: 'Pemrograman Web',   teacher: 'Budi Santoso', room: 'Lab Komputer 1', start: '07:45', end: '08:30' },
  { day: 0, period: 3, subject: 'Basis Data',        teacher: 'Budi Santoso', room: 'Lab Komputer 2', start: '08:45', end: '09:30' },
  { day: 0, period: 4, subject: 'Basis Data',        teacher: 'Budi Santoso', room: 'Lab Komputer 2', start: '09:30', end: '10:15' },
  { day: 0, period: 5, subject: 'Jaringan Komputer', teacher: 'Rina Marlina', room: 'Lab Jaringan', start: '10:30', end: '11:15' },
  { day: 1, period: 1, subject: 'Jaringan Komputer', teacher: 'Rina Marlina', room: 'Lab Jaringan', start: '07:00', end: '07:45' },
  { day: 1, period: 2, subject: 'Jaringan Komputer', teacher: 'Rina Marlina', room: 'Lab Jaringan', start: '07:45', end: '08:30' },
  { day: 1, period: 3, subject: 'Pemrograman Web',   teacher: 'Budi Santoso', room: 'Lab Komputer 1', start: '08:45', end: '09:30' },
  { day: 1, period: 4, subject: 'Pemrograman Web',   teacher: 'Budi Santoso', room: 'Lab Komputer 1', start: '09:30', end: '10:15' },
  { day: 2, period: 1, subject: 'Basis Data',        teacher: 'Budi Santoso', room: 'Lab Komputer 2', start: '07:00', end: '07:45' },
  { day: 2, period: 2, subject: 'Basis Data',        teacher: 'Budi Santoso', room: 'Lab Komputer 2', start: '07:45', end: '08:30' },
  { day: 3, period: 1, subject: 'Pemrograman Web',   teacher: 'Budi Santoso', room: 'Lab Komputer 1', start: '07:00', end: '07:45' },
  { day: 3, period: 3, subject: 'Jaringan Komputer', teacher: 'Rina Marlina', room: 'Lab Jaringan', start: '08:45', end: '09:30' },
  { day: 4, period: 1, subject: 'Basis Data',        teacher: 'Budi Santoso', room: 'Lab Komputer 2', start: '07:00', end: '07:45' },
  { day: 4, period: 2, subject: 'Pemrograman Web',   teacher: 'Budi Santoso', room: 'Lab Komputer 1', start: '07:45', end: '08:30' },
];

export default function ScheduleScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(TODAY_IDX);
  const [schedule, setSchedule]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      setSchedule(MOCK_SCHEDULE);
      setLoading(false);
      return;
    }
    if (!profile?.classId) { setLoading(false); return; }
    getCollection('schedules', where('classId', '==', profile.classId))
      .then(d => setSchedule(d as any[]))
      .finally(() => setLoading(false));
  }, [profile]);

  const todaySchedule = schedule
    .filter(s => s.day === selectedDay)
    .sort((a, b) => a.period - b.period);

  const subjectColors = [
    Colors.gray2, Colors.gray3, Colors.gray4, Colors.gray5,
  ];

  const getSubjectColor = (subject: string) => {
    let hash = 0;
    for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    return subjectColors[Math.abs(hash) % subjectColors.length];
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Jadwal Pelajaran</Text>
        <Text style={styles.headerSub}>Kelas {profile?.classId?.replace('class_', '').replace('_', ' ').toUpperCase() ?? '-'}</Text>
      </View>

      {/* Day selector */}
      <View style={styles.daySelector}>
        {DAYS.map((day, i) => {
          const isToday = i === TODAY_IDX;
          const isSelected = i === selectedDay;
          const count = schedule.filter(s => s.day === i).length;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
              onPress={() => setSelectedDay(i)}
              activeOpacity={0.75}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>{day.slice(0, 3)}</Text>
              <View style={[styles.dayDot, isSelected && styles.dayDotActive]}>
                <Text style={[styles.dayDotText, isSelected && styles.dayDotTextActive]}>{count}</Text>
              </View>
              {isToday && <View style={styles.todayIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {todaySchedule.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Tidak ada pelajaran</Text>
            <Text style={styles.emptySub}>{DAYS[selectedDay]} libur atau tidak ada jadwal</Text>
          </View>
        ) : (
          <>
            <Text style={styles.dayTitle}>{DAYS[selectedDay]}, {todaySchedule.length} mata pelajaran</Text>
            {todaySchedule.map((item, i) => (
              <View key={i} style={styles.scheduleCard}>
                <View style={[styles.subjectBar, { backgroundColor: getSubjectColor(item.subject) }]} />
                <View style={styles.timeCol}>
                  <Text style={styles.timeStart}>{item.start}</Text>
                  <View style={styles.timeLine} />
                  <Text style={styles.timeEnd}>{item.end}</Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.subjectName}>{item.subject}</Text>
                  <View style={styles.scheduleMetaRow}>
                    <Ionicons name="person-outline" size={12} color={Colors.gray6} />
                    <Text style={styles.scheduleMeta}>{item.teacher}</Text>
                  </View>
                  <View style={styles.scheduleMetaRow}>
                    <Ionicons name="location-outline" size={12} color={Colors.gray6} />
                    <Text style={styles.scheduleMeta}>{item.room}</Text>
                  </View>
                </View>
                <View style={styles.periodBadge}>
                  <Text style={styles.periodNum}>{item.period}</Text>
                  <Text style={styles.periodLabel}>Jam</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  headerTitle: { ...Typography.title2, color: Colors.white },
  headerSub: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  daySelector: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  dayBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: Radius.md, position: 'relative',
  },
  dayBtnActive: { backgroundColor: Colors.black },
  dayLabel:       { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600' },
  dayLabelActive: { color: Colors.white },
  dayDot: {
    marginTop: 4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.gray11, alignItems: 'center', justifyContent: 'center',
  },
  dayDotActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  dayDotText:       { ...Typography.caption2, color: Colors.gray5, fontWeight: '700' },
  dayDotTextActive: { color: Colors.white },
  todayIndicator: {
    position: 'absolute', bottom: 4, width: 4, height: 4,
    borderRadius: 2, backgroundColor: Colors.gray4,
  },

  content: { padding: Spacing.base },
  dayTitle: { ...Typography.footnote, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md },

  scheduleCard: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, marginBottom: 10,
    overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.sm,
  },
  subjectBar: { width: 4 },
  timeCol: {
    alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    minWidth: 52,
  },
  timeStart: { ...Typography.caption2, color: Colors.tertiaryLabel, fontWeight: '600' },
  timeEnd:   { ...Typography.caption2, color: Colors.quaternaryLabel },
  timeLine: { width: 1, flex: 1, backgroundColor: Colors.separator, marginVertical: 3 },
  scheduleInfo: { flex: 1, padding: Spacing.md, paddingLeft: Spacing.sm },
  subjectName:  { ...Typography.headline, color: Colors.black, fontWeight: '600', marginBottom: 6 },
  scheduleMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  scheduleMeta:    { ...Typography.caption1, color: Colors.tertiaryLabel },
  periodBadge: {
    paddingHorizontal: Spacing.md, justifyContent: 'center', alignItems: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: Colors.separator,
  },
  periodNum:   { fontSize: 20, fontWeight: '800', color: Colors.gray3 },
  periodLabel: { ...Typography.caption2, color: Colors.quaternaryLabel },

  empty:     { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
  emptySub:   { ...Typography.subheadline, color: Colors.tertiaryLabel, textAlign: 'center' },
});
