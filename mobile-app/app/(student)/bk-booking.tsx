import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, Modal,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, addDocument, where } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Timestamp } from 'firebase/firestore';

const COUNSELING_TYPES = ['akademik', 'sosial', 'pribadi', 'karir', 'pelanggaran'] as const;

export default function BKBookingScreen() {
  const { profile } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('akademik');
  const [notes, setNotes] = useState('');
  const [bkTeacherId, setBkTeacherId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      getCollection('users', where('role', '==', 'BK')),
      getCollection('counseling', where('studentId', '==', profile.uid)),
    ]).then(([bkTeachers, bookings]) => {
      if (bkTeachers.length > 0) setBkTeacherId((bkTeachers[0] as any).uid);
      setMyBookings((bookings as any[]).sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()));
    }).finally(() => setLoading(false));
  }, [profile]);

  const handleBook = async () => {
    if (!bkTeacherId) return Alert.alert('Error', 'Guru BK belum tersedia.');
    if (!selectedDate) return Alert.alert('Perhatian', 'Pilih tanggal konseling.');
    setBooking(true);
    try {
      const schedDate = new Date(selectedDate);
      await addDocument('counseling', {
        studentId: profile!.uid,
        bkTeacherId,
        type: selectedType,
        scheduledAt: Timestamp.fromDate(schedDate),
        status: 'booked',
        notes: notes.trim(),
      });
      Alert.alert('Berhasil', 'Booking konseling berhasil! Guru BK akan mengkonfirmasi.');
      setModalVisible(false);
      setNotes(''); setSelectedDate('');
      getCollection('counseling', where('studentId', '==', profile!.uid)).then(b =>
        setMyBookings((b as any[]).sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setBooking(false);
    }
  };

  const STATUS_COLOR: Record<string, { bg: string; c: string }> = {
    booked: { bg: '#EEF2FF', c: '#4F46E5' },
    ongoing: { bg: '#FFFBEB', c: '#D97706' },
    resolved: { bg: '#ECFDF5', c: '#059669' },
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Konseling BK</Text>
        <Text style={styles.infoText}>
          Bimbingan Konseling bersifat rahasia. Ceritakan masalahmu dengan aman.
        </Text>
        <Button title="+ Booking Sesi Konseling" onPress={() => setModalVisible(true)} fullWidth style={{ marginTop: 10 }} />
      </View>

      <Text style={styles.sectionTitle}>Riwayat Booking</Text>
      <FlatList
        data={myBookings}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada booking konseling</Text>}
        renderItem={({ item }) => {
          const sc = STATUS_COLOR[item.status] ?? { bg: '#F1F5F9', c: '#64748B' };
          return (
            <Card>
              <View style={styles.bookRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookType}>{item.type}</Text>
                  <Text style={styles.bookDate}>
                    {item.scheduledAt?.toDate?.().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                  {item.notes ? <Text style={styles.bookNotes}>{item.notes}</Text> : null}
                </View>
                <Badge label={item.status} bg={sc.bg} color={sc.c} />
              </View>
            </Card>
          );
        }}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Booking Sesi Konseling</Text>
            <Text style={styles.label}>Jenis Masalah</Text>
            <View style={styles.typeRow}>
              {COUNSELING_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, selectedType === t && styles.typeChipActive]}
                  onPress={() => setSelectedType(t)}
                >
                  <Text style={[styles.typeText, selectedType === t && styles.typeTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tanggal (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="2026-08-10"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>Catatan (opsional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Ceritakan singkat permasalahan kamu..."
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.btns}>
              <Button title="Batal" onPress={() => setModalVisible(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Booking" onPress={handleBook} loading={booking} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  infoCard: { backgroundColor: '#4F46E5', margin: 16, borderRadius: 14, padding: 16 },
  infoTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  infoText: { fontSize: 13, color: '#C7D2FE', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', paddingHorizontal: 16, marginTop: 4 },
  list: { padding: 16 },
  bookRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bookType: { fontSize: 14, fontWeight: '700', color: '#1E293B', textTransform: 'capitalize' },
  bookDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  bookNotes: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 32 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  typeChipActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  typeText: { fontSize: 12, color: '#64748B', fontWeight: '500', textTransform: 'capitalize' },
  typeTextActive: { color: '#4F46E5', fontWeight: '700' },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
  },
  btns: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
