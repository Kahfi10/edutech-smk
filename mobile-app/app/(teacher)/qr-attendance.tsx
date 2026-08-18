/**
 * Guru Mapel — QR Absensi Kelas
 *
 * Guru pilih mapel + kelas + jam ke- → QR muncul
 * Siswa scan → tercatat hadir di kelas itu
 * Daftar siswa yang sudah scan muncul real-time
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../src/context/AuthContext';
import {
  getCollection, subscribeCollection, where,
} from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { hapticLight } from '../../src/services/haptics';
import { Colors, Spacing, Radius, Shadow } from '../../src/constants/theme';

// Format: EDUTECH_MAPEL|{date}|{teacherId}|{classId}|{subjectId}|{period}
function makeQR(date: string, teacherId: string, classId: string, subjectId: string, period: number) {
  return `EDUTECH_MAPEL|${date}|${teacherId}|${classId}|${subjectId}|${period}`;
}

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TeacherQRAttendance() {
  const { profile } = useAuth();
  const insets      = useSafeAreaInsets();
  const router      = useRouter();

  const [subjects, setSubjects]     = useState<any[]>([]);
  const [classes, setClasses]       = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<Record<string, any>>({});
  const [classMap, setClassMap]     = useState<Record<string, string>>({});
  const [selSubject, setSelSubject] = useState('');
  const [selClass, setSelClass]     = useState('');
  const [period, setPeriod]         = useState(1);
  const [loading, setLoading]       = useState(true);
  const [scanned, setScanned]       = useState<any[]>([]);

  const today   = new Date().toISOString().split('T')[0];
  const qrReady = selSubject && selClass;
  const qrValue = qrReady
    ? makeQR(today, profile!.uid, selClass, selSubject, period)
    : '';

  // ─── Load subjects, classes, students ────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    Promise.all([
      getCollection('subjects', where('teacherId', '==', profile.uid)),
      getCollection('classes'),
      getCollection('users', where('role', '==', 'STUDENT')),
    ]).then(([subs, cls, users]) => {
      setSubjects(subs as any[]);
      setClasses(cls as any[]);
      const cm: Record<string, string> = {};
      (cls as any[]).forEach(c => (cm[c.id] = c.name));
      setClassMap(cm);
      const um: Record<string, any> = {};
      (users as any[]).forEach(u => (um[u.uid] = u));
      setAllStudents(um);
      // Auto-select first subject
      if ((subs as any[]).length > 0) setSelSubject((subs as any[])[0].id);
      if ((cls as any[]).length > 0)  setSelClass((cls as any[])[0].id);
      setLoading(false);
    });
  }, [profile]);

  // ─── Realtime: siapa yang sudah scan untuk sesi ini ──────────────────────────
  useEffect(() => {
    if (!qrReady) return;
    const unsub = subscribeCollection('attendance', (data) => {
      const sesi = data.find(
        (a: any) => a.date === today && a.classId === selClass && a.subjectId === selSubject && a.period === period
      );
      if (sesi) {
        setScanned(
          (sesi.records ?? [])
            .filter((r: any) => r.status === 'hadir')
            .sort((a: any, b: any) => (a.time ?? '').localeCompare(b.time ?? ''))
        );
      } else {
        setScanned([]);
      }
    }, where('classId', '==', selClass));
    return unsub;
  }, [selSubject, selClass, period, today, qrReady]);

  if (loading) return <LoadingSpinner fullScreen />;

  const selectedSubjectName = subjects.find(s => s.id === selSubject)?.name ?? '-';
  const selectedClassName   = classMap[selClass] ?? selClass ?? '-';

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>QR Absensi Kelas</Text>
          <Text style={styles.headerSub}>{selectedSubjectName} · {selectedClassName}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countNum}>{scanned.length}</Text>
          <Text style={styles.countLbl}>hadir</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>

        {/* Selector: Mapel */}
        <Text style={styles.sectionLabel}>MATA PELAJARAN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {subjects.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, selSubject === s.id && styles.chipActive]}
              onPress={() => { hapticLight(); setSelSubject(s.id); }}
            >
              <Text style={[styles.chipText, selSubject === s.id && styles.chipTextActive]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selector: Kelas */}
        <Text style={styles.sectionLabel}>KELAS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {classes.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, selClass === c.id && styles.chipActive]}
              onPress={() => { hapticLight(); setSelClass(c.id); }}
            >
              <Text style={[styles.chipText, selClass === c.id && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selector: Jam ke- */}
        <Text style={styles.sectionLabel}>JAM KE-</Text>
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => { hapticLight(); setPeriod(p); }}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* QR Code */}
        <Animated.View entering={FadeInDown.delay(100).springify().damping(18)} style={styles.qrCard}>
          <View style={styles.qrArea}>
            {qrReady ? (
              <QRCode
                value={qrValue}
                size={210}
                color={Colors.black}
                backgroundColor={Colors.white}
                quietZone={12}
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={56} color={Colors.gray7} />
                <Text style={styles.qrPlaceholderText}>Pilih mapel dan kelas dulu</Text>
              </View>
            )}
          </View>
          {qrReady && (
            <View style={styles.qrMeta}>
              <Text style={styles.qrMetaTitle}>{selectedSubjectName}</Text>
              <Text style={styles.qrMetaSub}>{selectedClassName} · Jam ke-{period} · {today}</Text>
              <View style={styles.qrHint}>
                <Ionicons name="information-circle-outline" size={13} color={Colors.gray5} />
                <Text style={styles.qrHintText}>
                  Siswa scan via menu "Scan Absensi" di aplikasi mereka
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Daftar yang sudah scan */}
        {scanned.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>SUDAH HADIR ({scanned.length})</Text>
            <View style={styles.listCard}>
              {scanned.map((r, i) => {
                const student = allStudents[r.studentId];
                return (
                  <View key={r.studentId}>
                    <View style={styles.studentRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {student?.name?.[0]?.toUpperCase() ?? '?'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{student?.name ?? r.studentId}</Text>
                        <Text style={styles.studentSub}>
                          {r.time ?? '-'} · {classMap[student?.classId] ?? student?.classId ?? '-'}
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.gray4} />
                    </View>
                    {i < scanned.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {qrReady && scanned.length === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={36} color={Colors.gray8} />
            <Text style={styles.emptyText}>Belum ada siswa yang scan</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base, flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.white },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center',
  },
  countNum: { fontSize: 20, fontWeight: '700', color: Colors.white, lineHeight: 24 },
  countLbl: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },

  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: Colors.tertiaryLabel,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginHorizontal: Spacing.base, marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  chipRow: { paddingHorizontal: Spacing.base, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  chipActive:     { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText:       { fontSize: 13, fontWeight: '500', color: Colors.secondaryLabel },
  chipTextActive: { color: Colors.white },

  periodRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginHorizontal: Spacing.base,
  },
  periodBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  periodBtnActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  periodText:       { fontSize: 14, fontWeight: '500', color: Colors.secondaryLabel },
  periodTextActive: { color: Colors.white, fontWeight: '700' },

  qrCard: {
    marginHorizontal: Spacing.base, marginTop: Spacing.xl,
    backgroundColor: Colors.cardBackground, borderRadius: Radius.xl,
    overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator, ...Shadow.md,
  },
  qrArea: {
    backgroundColor: Colors.white, alignItems: 'center', paddingVertical: Spacing.xl,
  },
  qrPlaceholder: {
    width: 210, height: 210, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gray11, borderRadius: Radius.lg, gap: 10,
  },
  qrPlaceholderText: { fontSize: 13, color: Colors.tertiaryLabel, textAlign: 'center' },
  qrMeta: {
    padding: Spacing.base, gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
  },
  qrMetaTitle: { fontSize: 16, fontWeight: '700', color: Colors.black },
  qrMetaSub:   { fontSize: 13, color: Colors.secondaryLabel },
  qrHint: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    marginTop: 6, backgroundColor: Colors.gray11, borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  qrHintText: { flex: 1, fontSize: 12, color: Colors.tertiaryLabel, lineHeight: 17 },

  listCard: {
    marginHorizontal: Spacing.base, backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { fontSize: 15, fontWeight: '600', color: Colors.gray3 },
  studentName:  { fontSize: 15, fontWeight: '500', color: Colors.black },
  studentSub:   { fontSize: 12, color: Colors.tertiaryLabel, marginTop: 1 },
  divider:      { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: 60 },

  emptyWrap:  { alignItems: 'center', paddingTop: 32, gap: 8 },
  emptyText:  { fontSize: 14, color: Colors.tertiaryLabel },
});
