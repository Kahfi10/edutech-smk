import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

export default function QRScanScreen() {
  const { profile } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualNis, setManualNis] = useState('');
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState<'qr' | 'manual'>('qr');

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const lookupStudent = async (nis: string) => {
    setSearching(true);
    try {
      const results = await getCollection('users', where('nis', '==', nis.trim()));
      if (results.length > 0) {
        setFoundStudent(results[0]);
      } else {
        Alert.alert('Tidak Ditemukan', `Tidak ada siswa dengan NIS: ${nis}`);
        setFoundStudent(null);
      }
    } catch (err) {
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

  const handleManualSearch = () => {
    if (!manualNis.trim()) return Alert.alert('Perhatian', 'Masukkan NIS terlebih dahulu.');
    lookupStudent(manualNis);
  };

  if (hasPermission === null) return <LoadingSpinner fullScreen message="Meminta izin kamera..." />;

  return (
    <View style={styles.container}>
      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'qr' && styles.modeBtnActive]}
          onPress={() => { setMode('qr'); setFoundStudent(null); setScanned(false); }}
        >
          <Text style={[styles.modeBtnText, mode === 'qr' && styles.modeBtnTextActive]}>📱 Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
          onPress={() => { setMode('manual'); setScanMode(false); setFoundStudent(null); }}
        >
          <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>⌨️ Input NISN</Text>
        </TouchableOpacity>
      </View>

      {mode === 'qr' && (
        <View style={styles.qrSection}>
          {!scanMode ? (
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => { setScanMode(true); setScanned(false); setFoundStudent(null); }}
            >
              <Text style={styles.scanBtnIcon}>📱</Text>
              <Text style={styles.scanBtnText}>Tap untuk Mulai Scan QR</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.cameraContainer}>
              {hasPermission ? (
                <BarCodeScanner
                  onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                  style={styles.camera}
                />
              ) : (
                <View style={styles.noPermission}>
                  <Text style={styles.noPermText}>Izin kamera diperlukan untuk scan QR</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => setScanMode(false)} style={styles.cancelScan}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {mode === 'manual' && (
        <View style={styles.manualSection}>
          <Text style={styles.label}>Masukkan NIS Siswa</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={manualNis}
              onChangeText={setManualNis}
              placeholder="Contoh: 2024001"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
            <Button title="Cari" onPress={handleManualSearch} loading={searching} style={{ paddingHorizontal: 20 }} />
          </View>
        </View>
      )}

      {/* Student Result */}
      {searching && <LoadingSpinner message="Mencari siswa..." />}
      {foundStudent && (
        <Card title="Siswa Ditemukan" style={styles.resultCard}>
          <View style={styles.studentInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{foundStudent.name[0]}</Text>
            </View>
            <View>
              <Text style={styles.studentName}>{foundStudent.name}</Text>
              <Text style={styles.studentNis}>NIS: {foundStudent.nis}</Text>
              <Text style={styles.studentClass}>Kelas: {foundStudent.classId ?? '-'}</Text>
            </View>
          </View>
          <View style={styles.markBtns}>
            <TouchableOpacity style={styles.markBtn} onPress={() => Alert.alert('Tercatat', `${foundStudent.name} tercatat hadir`)}>
              <Text style={styles.markBtnText}>✅ Hadir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.markBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => Alert.alert('Tercatat', `${foundStudent.name} tercatat terlambat`)}>
              <Text style={[styles.markBtnText, { color: '#DC2626' }]}>⏰ Terlambat</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  modeBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  modeBtnTextActive: { color: '#FFFFFF' },
  qrSection: { marginBottom: 16 },
  scanBtn: {
    height: 200, backgroundColor: '#EDE9FE', borderRadius: 16, borderWidth: 2, borderColor: '#7C3AED',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  scanBtnIcon: { fontSize: 48 },
  scanBtnText: { fontSize: 15, fontWeight: '600', color: '#7C3AED' },
  cameraContainer: { height: 280, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  noPermission: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  noPermText: { color: '#64748B', textAlign: 'center' },
  cancelScan: { position: 'absolute', bottom: 12, left: '50%', transform: [{ translateX: -40 }], backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  cancelText: { color: '#FFFFFF', fontWeight: '700' },
  manualSection: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1E293B', backgroundColor: '#FFFFFF',
  },
  resultCard: { borderLeftWidth: 4, borderLeftColor: '#7C3AED' },
  studentInfo: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  studentName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  studentNis: { fontSize: 13, color: '#64748B', marginTop: 2 },
  studentClass: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  markBtns: { flexDirection: 'row', gap: 8 },
  markBtn: { flex: 1, backgroundColor: '#ECFDF5', borderRadius: 8, padding: 10, alignItems: 'center' },
  markBtnText: { fontSize: 13, fontWeight: '700', color: '#059669' },
});
