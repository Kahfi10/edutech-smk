/**
 * Guru Piket — QR Absensi
 *
 * Alur baru:
 * 1. Guru Piket buka screen ini → QR session otomatis dibuat
 * 2. QR code besar ditampilkan di layar
 * 3. Siswa scan QR code → tercatat hadir/terlambat otomatis
 * 4. Daftar siswa yang sudah scan muncul real-time di bawah QR
 * 5. Mode manual tetap tersedia sebagai fallback
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Alert, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import {
  getCollection, getDocument, setDocument, updateDocument,
  subscribeCollection, where,
} from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Button } from '../../src/components/ui/Button';
import { useToast } from '../../src/context/ToastContext';
import { hapticSuccess, hapticLight, hapticError } from '../../src/services/haptics';
import { Colors, Spacing, Radius, Shadow } from '../../src/constants/theme';

// ─── Konstanta jam cutoff ─────────────────────────────────────────────────────
const CUTOFF_HOUR   = 7;
const CUTOFF_MINUTE = 15; // 07:15 = batas hadir, setelah ini = terlambat

// ─── Generate QR content ──────────────────────────────────────────────────────
// Format: EDUTECH_PIKET|{date}|{piketUid}|{cutoffHour}|{cutoffMinute}
function makeQRValue(date: string, piketUid: string) {
  return `EDUTECH_PIKET|${date}|${piketUid}|${CUTOFF_HOUR}|${CUTOFF_MINUTE}`;
}

type Mode = 'qr' | 'manual';

export default function QRScanScreen() {
  const { profile } = useAuth();
  const insets      = useSafeAreaInsets();
  const { showToast } = useToast();

  const [mode, setMode]           = useState<Mode>('qr');
  const [scannedStudents, setScannedStudents] = useState<any[]>([]);
  const [userMap, setUserMap]     = useState<Record<string, any>>({});
  const [classMap, setClassMap]   = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(true);

  // Manual mode state
  const [permission, requestPermission] = useCameraPermissions();
  const [manualNis, setManualNis] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [recording, setRecording] = useState(false);

  const today  = new Date().toISOString().split('T')[0];
  const qrValue = profile ? makeQRValue(today, profile.uid) : '';
  const logId   = profile ? `${today}_${profile.uid}` : '';

  const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ─── Load user map + class map + realtime checkins ──────────────────────────
  useEffect(() => {
    // Load students
    getCollection('users', where('role', '==', 'STUDENT'))
      .then(users => {
        const m: Record<string, any> = {};
        (users as any[]).forEach(u => (m[u.uid] = u));
        setUserMap(m);
      });

    // Load classes → map id ke nama
    getCollection('classes').then(classes => {
      const cm: Record<string, string> = {};
      (classes as any[]).forEach(c => (cm[c.id] = c.name));
      setClassMap(cm);
    });

    // Subscribe ke attendance hari ini untuk semua kelas → filter yang sudah checkin
    const unsub = subscribeCollection('attendance', (data) => {
      // Kumpulkan semua record dari semua kelas hari ini
      const todayRecords: any[] = [];
      data
        .filter((a: any) => a.date === today)
        .forEach((a: any) => {
          (a.records ?? []).forEach((r: any) => {
            if (!todayRecords.find(x => x.studentId === r.studentId)) {
              todayRecords.push({ ...r, classId: a.classId });
            }
          });
        });
      setScannedStudents(todayRecords.sort(
        (a, b) => (a.time ?? '').localeCompare(b.time ?? '')
      ));
      setLoading(false);
    });
    return unsub;
  }, [today]);

  // ─── Manual: lookup siswa ────────────────────────────────────────────────────
  const lookupStudent = async (nis: string) => {
    if (!nis.trim()) return;
    setSearching(true);
    setFoundStudent(null);
    try {
      const results = await getCollection('users', where('nis', '==', nis.trim()));
      if ((results as any[]).length > 0) setFoundStudent((results as any[])[0]);
      else showToast(`NIS ${nis} tidak ditemukan`, 'error');
    } catch {
      showToast('Gagal mencari siswa', 'error');
    } finally {
      setSearching(false);
    }
  };

  // ─── Record attendance (untuk manual input) ──────────────────────────────────
  const recordManual = async (type: 'hadir' | 'terlambat') => {
    if (!foundStudent || !profile || recording) return;
    setRecording(true);
    try {
      await writeAttendance(foundStudent, type);
      hapticSuccess();
      showToast(`${foundStudent.name} — ${type === 'hadir' ? 'Hadir' : 'Terlambat'} ✓`, 'success');
      setFoundStudent(null);
      setManualNis('');
    } catch {
      hapticError();
      showToast('Gagal mencatat', 'error');
    } finally {
      setRecording(false);
    }
  };

  // ─── Shared: tulis ke Firestore ──────────────────────────────────────────────
  const writeAttendance = async (student: any, type: 'hadir' | 'terlambat') => {
    if (!profile) return;
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // 1. Attendance collection
    if (student.classId) {
      const attendId = `${student.classId}_${today}`;
      const existing: any = await getDocument('attendance', attendId);
      const newRecord = { studentId: student.uid, status: 'hadir', note: type === 'terlambat' ? 'Terlambat' : '', time };

      if (!existing) {
        await setDocument('attendance', attendId, {
          classId: student.classId, date: today,
          records: [newRecord], createdAt: Timestamp.now(),
        });
      } else {
        const existingRecords: any[] = existing.records ?? [];
        if (!existingRecords.some((r: any) => r.studentId === student.uid)) {
          await updateDocument('attendance', attendId, {
            records: [...existingRecords, newRecord],
          });
        }
      }
    }

    // 2. Piket log jika terlambat
    if (type === 'terlambat') {
      const newEvent = { studentId: student.nis ?? student.uid, type: 'terlambat', description: `${student.name} terlambat`, time };
      const existingLog: any = await getDocument('piket_logs', logId);
      if (!existingLog) {
        await setDocument('piket_logs', logId, {
          date: today, piketTeacherId: profile.uid,
          events: [newEvent], createdAt: Timestamp.now(),
        });
      } else {
        await updateDocument('piket_logs', logId, {
          events: [...(existingLog.events ?? []), newEvent],
        });
      }
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>QR Absensi</Text>
          <Text style={styles.subtitle}>{dateStr}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countNum}>{scannedStudents.length}</Text>
          <Text style={styles.countLbl}>hadir</Text>
        </View>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        {([
          { key: 'qr',     label: 'Tampilkan QR', icon: 'qr-code-outline'  },
          { key: 'manual', label: 'Input Manual',  icon: 'keypad-outline'   },
        ] as const).map(m => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeBtn, mode === m.key && styles.modeBtnActive]}
            onPress={() => { hapticLight(); setMode(m.key); setFoundStudent(null); }}
          >
            <Ionicons name={m.icon} size={17} color={mode === m.key ? Colors.white : Colors.gray5} />
            <Text style={[styles.modeBtnText, mode === m.key && styles.modeBtnTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* ─── Mode QR ─────────────────────────────────────────────────────── */}
        {mode === 'qr' && (
          <>
            {/* QR Code Card */}
            <Animated.View entering={FadeInDown.delay(50).springify().damping(18)} style={styles.qrCard}>
              <View style={styles.qrArea}>
                <QRCode
                  value={qrValue}
                  size={220}
                  color={Colors.black}
                  backgroundColor={Colors.white}
                  quietZone={12}
                />
              </View>
              <View style={styles.qrInfo}>
                <Ionicons name="time-outline" size={14} color={Colors.gray5} />
                <Text style={styles.qrInfoText}>
                  Tepat waktu sebelum 07:15 · Setelah itu tercatat terlambat
                </Text>
              </View>
              <View style={styles.qrInfo}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.gray5} />
                <Text style={styles.qrInfoText}>
                  Tunjukkan QR ini ke siswa. Siswa scan via menu "Scan Absensi" di aplikasi mereka.
                </Text>
              </View>
            </Animated.View>

            {/* Daftar siswa yang sudah scan */}
            {scannedStudents.length > 0 && (
              <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
                <Text style={styles.sectionTitle}>Sudah Absen ({scannedStudents.length})</Text>
                <View style={styles.listCard}>
                  {scannedStudents.map((r, i) => {
                    const student = userMap[r.studentId];
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
                          <View style={[styles.statusBadge, r.note === 'Terlambat' && styles.lateBadge]}>
                            <Text style={[styles.statusText, r.note === 'Terlambat' && styles.lateText]}>
                              {r.note === 'Terlambat' ? 'Terlambat' : 'Hadir'}
                            </Text>
                          </View>
                        </View>
                        {i < scannedStudents.length - 1 && <View style={styles.divider} />}
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {scannedStudents.length === 0 && (
              <View style={styles.emptyWrap}>
                <Ionicons name="people-outline" size={40} color={Colors.gray8} />
                <Text style={styles.emptyText}>Belum ada siswa yang absen</Text>
                <Text style={styles.emptySub}>Tampilkan QR code di atas kepada siswa</Text>
              </View>
            )}
          </>
        )}

        {/* ─── Mode Manual ─────────────────────────────────────────────────── */}
        {mode === 'manual' && (
          <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.manualSection}>
            <Text style={styles.manualLabel}>NISN SISWA</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={manualNis}
                onChangeText={setManualNis}
                placeholder="Contoh: 2024001"
                keyboardType="numeric"
                placeholderTextColor={Colors.gray7}
                returnKeyType="search"
                onSubmitEditing={() => lookupStudent(manualNis)}
              />
              <Button title="Cari" onPress={() => lookupStudent(manualNis)} loading={searching} />
            </View>

            {searching && <LoadingSpinner message="Mencari siswa..." />}

            {foundStudent && !searching && (
              <View style={styles.resultCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{foundStudent.name?.[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{foundStudent.name}</Text>
                  <Text style={styles.studentSub}>NIS: {foundStudent.nis ?? '-'} · {foundStudent.classId ?? '-'}</Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity style={styles.hadirBtn} onPress={() => recordManual('hadir')} disabled={recording}>
                    <Ionicons name="checkmark" size={18} color={Colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.lateBtn} onPress={() => recordManual('terlambat')} disabled={recording}>
                    <Ionicons name="time-outline" size={18} color={Colors.gray3} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  title:    { fontSize: 20, fontWeight: '600', color: Colors.white },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
  },
  countNum: { fontSize: 22, fontWeight: '700', color: Colors.white, lineHeight: 26 },
  countLbl: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  modeRow: { flexDirection: 'row', margin: Spacing.base, gap: 8 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: Radius.md,
    backgroundColor: Colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.xs,
  },
  modeBtnActive:     { backgroundColor: Colors.black, borderColor: Colors.black },
  modeBtnText:       { fontSize: 14, fontWeight: '400', color: Colors.gray5 },
  modeBtnTextActive: { color: Colors.white, fontWeight: '600' },

  qrCard: {
    marginHorizontal: Spacing.base, backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.md,
  },
  qrArea: {
    backgroundColor: Colors.white, alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  qrInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
  },
  qrInfoText: { flex: 1, fontSize: 12, color: Colors.tertiaryLabel, lineHeight: 17 },

  sectionTitle: {
    fontSize: 11, color: Colors.tertiaryLabel, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginHorizontal: Spacing.base, marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
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
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { fontSize: 16, fontWeight: '600', color: Colors.gray3 },
  studentName:  { fontSize: 15, fontWeight: '500', color: Colors.black },
  studentSub:   { fontSize: 12, color: Colors.tertiaryLabel, marginTop: 1 },
  statusBadge:  { backgroundColor: Colors.gray11, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  lateBadge:    { backgroundColor: Colors.gray3 },
  statusText:   { fontSize: 11, fontWeight: '600', color: Colors.gray4 },
  lateText:     { color: Colors.white },
  divider:      { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: 62 },

  emptyWrap:  { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyText:  { fontSize: 15, color: Colors.secondaryLabel, fontWeight: '500' },
  emptySub:   { fontSize: 12, color: Colors.tertiaryLabel, textAlign: 'center' },

  manualSection: { margin: Spacing.base, gap: Spacing.md },
  manualLabel: {
    fontSize: 11, color: Colors.tertiaryLabel, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    backgroundColor: Colors.cardBackground, borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 13,
    fontSize: 17, color: Colors.black, ...Shadow.xs,
  },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.sm,
  },
  actionBtns: { flexDirection: 'row', gap: 8 },
  hadirBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.gray1, alignItems: 'center', justifyContent: 'center',
  },
  lateBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.gray11, alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
});
