/**
 * Siswa — Scan Absensi
 *
 * Siswa scan QR code yang ditampilkan Guru Piket.
 * QR format: EDUTECH_PIKET|{date}|{piketUid}|{cutoffHour}|{cutoffMinute}
 * Sistem otomatis tentukan hadir/terlambat berdasarkan waktu scan.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import {
  getDocument, setDocument, updateDocument,
} from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useToast } from '../../src/context/ToastContext';
import { hapticSuccess, hapticError, hapticLight } from '../../src/services/haptics';
import { Colors, Spacing, Radius, Shadow } from '../../src/constants/theme';

// ─── Parse QR content ─────────────────────────────────────────────────────────
type QRType = 'piket' | 'mapel';

interface ParsedQR {
  type:       QRType;
  date:       string;
  teacherId:  string;
  classId?:   string;   // mapel only
  subjectId?: string;   // mapel only
  period?:    number;   // mapel only
  cutoffHour:   number;
  cutoffMinute: number;
}

function parseQR(data: string): ParsedQR | null {
  const parts = data.split('|');

  // Format piket: EDUTECH_PIKET|{date}|{piketUid}|{cutoffHour}|{cutoffMinute}
  if (parts[0] === 'EDUTECH_PIKET' && parts.length === 5) {
    return {
      type: 'piket', date: parts[1], teacherId: parts[2],
      cutoffHour: parseInt(parts[3], 10), cutoffMinute: parseInt(parts[4], 10),
    };
  }

  // Format mapel: EDUTECH_MAPEL|{date}|{teacherId}|{classId}|{subjectId}|{period}
  if (parts[0] === 'EDUTECH_MAPEL' && parts.length === 6) {
    return {
      type: 'mapel', date: parts[1], teacherId: parts[2],
      classId: parts[3], subjectId: parts[4], period: parseInt(parts[5], 10),
      cutoffHour: 23, cutoffMinute: 59, // tidak ada cutoff untuk absensi mapel
    };
  }

  return null;
}

type State = 'idle' | 'scanning' | 'success' | 'error';

export default function AbsensiScanScreen() {
  const { profile }   = useAuth();
  const insets        = useSafeAreaInsets();
  const router        = useRouter();
  const { showToast } = useToast();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState]       = useState<State>('idle');
  const [scanned, setScanned]           = useState(false);
  const [result, setResult] = useState<{
    status: 'hadir' | 'terlambat';
    type: 'piket' | 'mapel';
    time: string;
    subjectId?: string;
  } | null>(null);
  const [saving, setSaving]             = useState(false);

  // ─── Handle scan ────────────────────────────────────────────────────────────
  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || saving) return;
    setScanned(true);

    const session = parseQR(data);
    if (!session) {
      hapticError();
      showToast('QR tidak valid — scan QR dari Guru Piket atau Guru Mapel', 'error');
      setScanState('error');
      setTimeout(() => { setScanState('idle'); setScanned(false); }, 2000);
      return;
    }

    // Validasi tanggal
    const today = new Date().toISOString().split('T')[0];
    if (session.date !== today) {
      hapticError();
      showToast('QR sudah kadaluarsa', 'error');
      setScanState('error');
      setTimeout(() => { setScanState('idle'); setScanned(false); }, 2000);
      return;
    }

    setSaving(true);
    const now     = new Date();
    const cutoff  = new Date();
    cutoff.setHours(session.cutoffHour, session.cutoffMinute, 0, 0);
    const late    = session.type === 'piket' ? now > cutoff : false; // mapel tidak ada terlambat
    const status: 'hadir' | 'terlambat' = late ? 'terlambat' : 'hadir';
    const nowTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    try {
      // ── 1. Tulis ke attendance ─────────────────────────────────────────────
      const classId   = session.type === 'mapel' ? session.classId : profile?.classId;
      const subjectId = session.type === 'mapel' ? session.subjectId : undefined;

      if (classId) {
        const attendId = `${classId}_${today}${session.type === 'mapel' ? `_${subjectId}_p${session.period}` : ''}`;
        const existing: any = await getDocument('attendance', attendId);
        const newRecord = {
          studentId: profile!.uid, status: 'hadir',
          note: late ? 'Terlambat' : '', time: nowTime,
          ...(subjectId && { subjectId, period: session.period }),
        };

        if (!existing) {
          await setDocument('attendance', attendId, {
            classId, date: today, records: [newRecord], createdAt: Timestamp.now(),
            ...(subjectId && { subjectId, period: session.period, teacherId: session.teacherId }),
          });
        } else {
          const records: any[] = existing.records ?? [];
          if (records.some((r: any) => r.studentId === profile!.uid)) {
            hapticError();
            showToast('Kamu sudah absen untuk sesi ini', 'warning');
            setScanState('error');
            setSaving(false);
            setTimeout(() => { setScanState('idle'); setScanned(false); }, 2000);
            return;
          }
          await updateDocument('attendance', attendId, {
            records: [...records, newRecord],
          });
        }
      }

      // ── 2. Piket log jika terlambat (hanya untuk tipe piket) ──────────────
      if (session.type === 'piket' && late) {
        const logId = `${today}_${session.teacherId}`;
        const newEvent = {
          studentId: profile?.nis ?? profile?.uid ?? '',
          type: 'terlambat', description: `${profile?.name} terlambat (scan mandiri)`,
          time: nowTime,
        };
        const existingLog: any = await getDocument('piket_logs', logId);
        if (!existingLog) {
          await setDocument('piket_logs', logId, {
            date: today, piketTeacherId: session.teacherId,
            events: [newEvent], createdAt: Timestamp.now(),
          });
        } else {
          await updateDocument('piket_logs', logId, {
            events: [...(existingLog.events ?? []), newEvent],
          });
        }
      }

      hapticSuccess();
      setResult({ status, type: session.type, time: nowTime, subjectId: session.subjectId });
      setScanState('success');

    } catch (e: any) {
      hapticError();
      showToast('Gagal mencatat absensi', 'error');
      setScanState('error');
      setTimeout(() => { setScanState('idle'); setScanned(false); }, 2000);
    } finally {
      setSaving(false);
    }
  };

  // ─── Guard ───────────────────────────────────────────────────────────────────
  if (!permission) return <LoadingSpinner fullScreen />;

  // ─── Success state ───────────────────────────────────────────────────────────
  if (scanState === 'success' && result) {
    const isLateStatus = result.status === 'terlambat';
    return (
      <Animated.View entering={FadeIn.duration(300)} style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Absensi</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.resultWrap}>
          <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.resultCard}>
            {/* Icon */}
            <View style={[styles.resultIcon, isLateStatus && styles.resultIconLate]}>
              <Ionicons
                name={isLateStatus ? 'time' : 'checkmark-circle'}
                size={56}
                color={Colors.white}
              />
            </View>

            {/* Status */}
            <Text style={styles.resultStatus}>
              {isLateStatus ? 'Tercatat Terlambat' : 'Absensi Berhasil!'}
            </Text>
            <Text style={styles.resultName}>{profile?.name}</Text>
            <Text style={styles.resultTime}>Pukul {result.time}</Text>
            <Text style={styles.resultContext}>
              {result.type === 'piket' ? 'Absensi pagi — Guru Piket' : 'Absensi kelas — Guru Mapel'}
            </Text>

            {isLateStatus && (
              <View style={styles.lateNote}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.gray5} />
                <Text style={styles.lateNoteText}>
                  Absensi dicatat terlambat karena melewati batas waktu masuk
                </Text>
              </View>
            )}
          </Animated.View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>Kembali ke Dashboard</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // ─── Scanner UI ──────────────────────────────────────────────────────────────
  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Absensi</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        {permission.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleScan}
            />

            {/* Overlay */}
            <View style={styles.overlay} pointerEvents="none">
              {/* Frame */}
              <View style={styles.frameWrap}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>

              {/* Instruction */}
          <Text style={styles.scanInstruction}>
            {saving
              ? 'Menyimpan absensi...'
              : scanState === 'error'
                ? 'QR tidak valid, coba lagi'
                : 'Arahkan ke QR Guru Piket atau Guru Mapel'
            }
          </Text>
            </View>

            {saving && (
              <View style={styles.savingOverlay}>
                <LoadingSpinner message="Mencatat absensi..." />
              </View>
            )}
          </>
        ) : (
          <View style={styles.noPermWrap}>
            <Ionicons name="camera-outline" size={48} color={Colors.gray6} />
            <Text style={styles.noPermText}>Izin kamera diperlukan</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Izinkan Kamera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Info bottom */}
      <View style={[styles.bottomInfo, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.infoRow}>
          <Ionicons name="sunny-outline" size={16} color={Colors.gray5} />
          <Text style={styles.infoText}>Pastikan layar HP Guru Piket cukup terang</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={Colors.gray5} />
          <Text style={styles.infoText}>Scan sebelum 07:15 untuk tercatat hadir tepat waktu</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const FRAME_SIZE = 220;
const CORNER_LEN = 28;
const CORNER_W   = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.base,
    backgroundColor: Colors.black,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.white },

  cameraContainer: { flex: 1, position: 'relative' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  frameWrap: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    position: 'relative', backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute', width: CORNER_LEN, height: CORNER_LEN,
    borderColor: Colors.white,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderBottomRightRadius: 4 },
  scanInstruction: {
    marginTop: 24, fontSize: 14, color: Colors.white, fontWeight: '500',
    textAlign: 'center', paddingHorizontal: 32,
  },

  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },

  noPermWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gray11, gap: 12,
  },
  noPermText: { fontSize: 16, color: Colors.secondaryLabel },
  permBtn: {
    backgroundColor: Colors.black, borderRadius: Radius.md,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 4,
  },
  permBtnText: { fontSize: 15, fontWeight: '600', color: Colors.white },

  bottomInfo: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base, gap: Spacing.sm,
  },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', flex: 1 },

  // ── Success state ──
  resultWrap: {
    flex: 1, backgroundColor: Colors.background,
    padding: Spacing.base, justifyContent: 'center', gap: Spacing.base,
  },
  resultCard: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.xl,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.md,
  },
  resultIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.gray1, alignItems: 'center', justifyContent: 'center',
  },
  resultIconLate: { backgroundColor: Colors.gray4 },
  resultStatus:   { fontSize: 22, fontWeight: '700', color: Colors.black, textAlign: 'center' },
  resultName:     { fontSize: 17, color: Colors.secondaryLabel },
  resultTime:     { fontSize: 15, color: Colors.tertiaryLabel },
  resultContext:  { fontSize: 12, color: Colors.quaternaryLabel },
  lateNote: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: Spacing.md,
    marginTop: 4,
  },
  lateNoteText: { flex: 1, fontSize: 12, color: Colors.secondaryLabel, lineHeight: 17 },
  doneBtn: {
    backgroundColor: Colors.black, borderRadius: Radius.lg,
    padding: Spacing.base, alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
