import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Button } from '../../src/components/ui/Button';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { USE_MOCK } from '../../src/constants/mockData';

export default function QRScanScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualNis, setManualNis] = useState('');
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState<'qr' | 'manual'>('qr');

  const lookupStudent = async (nis: string) => {
    if (USE_MOCK) {
      setFoundStudent({ name: 'Ahmad Fauzi', nis, classId: 'XI-RPL-1' });
      return;
    }
    setSearching(true);
    try {
      const results = await getCollection('users', where('nis', '==', nis.trim()));
      if (results.length > 0) setFoundStudent(results[0]);
      else Alert.alert('Tidak Ditemukan', `Tidak ada siswa dengan NIS: ${nis}`);
    } catch {
      Alert.alert('Error', 'Gagal mencari siswa.');
    } finally {
      setSearching(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setScanMode(false);
    lookupStudent(data);
  };

  if (!permission) return <LoadingSpinner fullScreen />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scan Absensi</Text>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        {(['qr', 'manual'] as const).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            onPress={() => { setMode(m); setScanMode(false); setFoundStudent(null); setScanned(false); }}
          >
            <Ionicons
              name={m === 'qr' ? 'qr-code-outline' : 'keypad-outline'}
              size={18}
              color={mode === m ? Colors.white : Colors.gray5}
            />
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
              {m === 'qr' ? 'Scan QR' : 'Input NISN'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* QR Mode */}
      {mode === 'qr' && (
        <View style={styles.section}>
          {!scanMode ? (
            <TouchableOpacity
              style={styles.scanPlaceholder}
              onPress={async () => {
                if (!permission.granted) await requestPermission();
                setScanMode(true);
                setScanned(false);
                setFoundStudent(null);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code-outline" size={56} color={Colors.gray7} />
              <Text style={styles.scanPlaceholderText}>Tap untuk Mulai Scan</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.cameraWrap}>
              {permission.granted ? (
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
              ) : (
                <View style={styles.noPermission}>
                  <Ionicons name="camera-outline" size={40} color={Colors.gray6} />
                  <Text style={styles.noPermText}>Izin kamera diperlukan</Text>
                  <Button title="Izinkan Kamera" onPress={requestPermission} style={{ marginTop: 12 }} />
                </View>
              )}
              <TouchableOpacity onPress={() => setScanMode(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <View style={styles.section}>
          <Text style={styles.label}>Masukkan NISN Siswa</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={manualNis}
              onChangeText={setManualNis}
              placeholder="Contoh: 2024001"
              keyboardType="numeric"
              placeholderTextColor={Colors.gray7}
              returnKeyType="search"
              onSubmitEditing={() => manualNis.trim() && lookupStudent(manualNis)}
            />
            <Button
              title="Cari"
              onPress={() => lookupStudent(manualNis)}
              loading={searching}
              style={{ paddingHorizontal: 20 }}
            />
          </View>
        </View>
      )}

      {/* Result */}
      {searching && <LoadingSpinner message="Mencari siswa..." />}
      {foundStudent && !searching && (
        <View style={styles.resultCard}>
          <View style={styles.resultAvatar}>
            <Text style={styles.resultAvatarText}>{foundStudent.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resultName}>{foundStudent.name}</Text>
            <Text style={styles.resultSub}>NIS: {foundStudent.nis ?? '-'}  ·  {foundStudent.classId ?? '-'}</Text>
          </View>
          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.hadirBtn}
              onPress={() => Alert.alert('Tercatat', `${foundStudent.name} — Hadir`)}
            >
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.lateBtn}
              onPress={() => Alert.alert('Tercatat', `${foundStudent.name} — Terlambat`)}
            >
              <Ionicons name="time-outline" size={16} color={Colors.gray3} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base,
  },
  title: { ...Typography.title3, color: Colors.white },

  modeRow: {
    flexDirection: 'row', margin: Spacing.base, gap: 8,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: Radius.md,
    backgroundColor: Colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    ...Shadow.xs,
  },
  modeBtnActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  modeBtnText: { ...Typography.subheadline, color: Colors.gray5 },
  modeBtnTextActive: { color: Colors.white, fontWeight: '600' },

  section: { paddingHorizontal: Spacing.base },
  label: {
    ...Typography.footnote, color: Colors.tertiaryLabel,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: Spacing.sm,
  },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    backgroundColor: Colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 13,
    ...Typography.body, color: Colors.black, ...Shadow.xs,
  },

  scanPlaceholder: {
    height: 220, borderRadius: Radius.lg,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5, borderColor: Colors.gray9, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    ...Shadow.xs,
  },
  scanPlaceholderText: { ...Typography.subheadline, color: Colors.tertiaryLabel },

  cameraWrap: { height: 300, borderRadius: Radius.lg, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  noPermission: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray11, gap: 8 },
  noPermText: { ...Typography.subheadline, color: Colors.tertiaryLabel },
  cancelBtn: {
    position: 'absolute', bottom: 12, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.full,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  cancelText: { ...Typography.subheadline, color: Colors.white, fontWeight: '600' },

  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: Spacing.base, backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    ...Shadow.md,
  },
  resultAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.gray2, alignItems: 'center', justifyContent: 'center',
  },
  resultAvatarText: { ...Typography.title3, color: Colors.white },
  resultName: { ...Typography.headline, color: Colors.black },
  resultSub: { ...Typography.footnote, color: Colors.tertiaryLabel, marginTop: 2 },
  resultActions: { flexDirection: 'row', gap: 8 },
  hadirBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.gray1, alignItems: 'center', justifyContent: 'center',
  },
  lateBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.gray11, alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
});
