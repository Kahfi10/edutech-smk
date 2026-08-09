import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, addDocument, where } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

const STATUSES = ['hadir', 'izin', 'sakit', 'alpha'] as const;
type AttendStatus = typeof STATUSES[number];

const STATUS_STYLE: Record<AttendStatus, { color: string; bg: string }> = {
  hadir: { color: Colors.black,  bg: Colors.gray11 },
  izin:  { color: Colors.gray4,  bg: Colors.gray10 },
  sakit: { color: Colors.gray4,  bg: Colors.gray10 },
  alpha: { color: Colors.white,  bg: Colors.gray2  },
};

export default function AttendanceScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses]   = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selSubject, setSelSubject] = useState('');
  const [selClass, setSelClass]     = useState('');
  const [period, setPeriod]         = useState(1);
  const [records, setRecords]       = useState<Record<string, AttendStatus>>({});
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    if (!profile) return;
    getCollection('subjects', where('teacherId', '==', profile.uid)).then(setSubjects);
    getCollection('classes').then(setClasses);
  }, [profile]);

  useEffect(() => {
    if (!selClass) return;
    setLoading(true);
    getCollection('users', where('role', '==', 'STUDENT'), where('classId', '==', selClass))
      .then(data => {
        setStudents(data as any[]);
        const init: Record<string, AttendStatus> = {};
        (data as any[]).forEach((s: any) => (init[s.uid] = 'hadir'));
        setRecords(init);
      }).finally(() => setLoading(false));
  }, [selClass]);

  const toggleStatus = (uid: string) => {
    const idx = STATUSES.indexOf(records[uid] ?? 'hadir');
    setRecords(r => ({ ...r, [uid]: STATUSES[(idx + 1) % STATUSES.length] }));
  };

  const saveAttendance = async () => {
    if (!selSubject) return Alert.alert('Pilih mata pelajaran');
    if (!selClass)   return Alert.alert('Pilih kelas');
    if (students.length === 0) return Alert.alert('Tidak ada siswa');
    setSaving(true);
    try {
      await addDocument('attendance', {
        date: new Date().toISOString().split('T')[0],
        subjectId: selSubject, classId: selClass, period,
        inputBy: profile!.uid,
        records: students.map(s => ({ studentId: s.uid, status: records[s.uid] ?? 'hadir' })),
      });
      Alert.alert('Berhasil', 'Absensi disimpan!');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Input Absensi</Text>
        <Text style={styles.headerDate}>{today}</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Mata Pelajaran</Text>
        <FlatList
          horizontal data={subjects} keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selSubject === item.id && styles.chipActive]}
              onPress={() => setSelSubject(item.id)}
            >
              <Text style={[styles.chipText, selSubject === item.id && styles.chipTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
        <Text style={[styles.filterLabel, { marginTop: Spacing.sm }]}>Kelas</Text>
        <FlatList
          horizontal data={classes} keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selClass === item.id && styles.chipActive]}
              onPress={() => setSelClass(item.id)}
            >
              <Text style={[styles.chipText, selClass === item.id && styles.chipTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
        <View style={styles.periodRow}>
          <Text style={styles.filterLabel}>Jam ke-</Text>
          <View style={styles.periodBtns}>
            {[1,2,3,4,5,6,7,8].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {loading ? <LoadingSpinner /> : (
        <FlatList
          data={students}
          keyExtractor={i => i.uid}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={44} color={Colors.gray8} />
              <Text style={styles.emptyText}>Pilih kelas terlebih dahulu</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const status = records[item.uid] ?? 'hadir';
            const sc = STATUS_STYLE[status];
            return (
              <TouchableOpacity style={styles.studentRow} onPress={() => toggleStatus(item.uid)} activeOpacity={0.7}>
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                <Text style={styles.studentName}>{item.name}</Text>
                <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.color }]}>{status.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: 60 }} />
          )}
        />
      )}

      {students.length > 0 && (
        <View style={[styles.saveBar, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.saveInfo}>{students.length} siswa</Text>
          <Button title="Simpan Absensi" onPress={saveAttendance} loading={saving} style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.gray1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  headerTitle: { ...Typography.title2, color: Colors.white },
  headerDate: { ...Typography.footnote, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  filters: {
    backgroundColor: Colors.cardBackground, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator,
  },
  filterLabel: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { ...Typography.footnote, color: Colors.secondaryLabel },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  periodBtns: { flexDirection: 'row', gap: 6 },
  periodBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.gray11, alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  periodBtnActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  periodText: { ...Typography.subheadline, color: Colors.gray5, fontWeight: '600' },
  periodTextActive: { color: Colors.white },
  list: { backgroundColor: Colors.cardBackground },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    backgroundColor: Colors.cardBackground,
  },
  indexBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.gray11, alignItems: 'center', justifyContent: 'center',
  },
  indexText: { ...Typography.caption1, color: Colors.gray5, fontWeight: '700' },
  studentName: { ...Typography.body, color: Colors.black, flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  statusText: { ...Typography.caption1, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { ...Typography.subheadline, color: Colors.tertiaryLabel },
  saveBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.base, backgroundColor: Colors.cardBackground,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
  },
  saveInfo: { ...Typography.footnote, color: Colors.tertiaryLabel },
});
