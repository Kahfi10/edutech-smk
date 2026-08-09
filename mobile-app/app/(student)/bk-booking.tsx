import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, addDocument, where } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';
import { USE_MOCK } from '../../src/constants/mockData';

const TYPES = ['akademik', 'sosial', 'pribadi', 'karir', 'pelanggaran'] as const;

export default function BKBookingScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<any[]>([]);
  const [bkTeacherId, setBkTeacherId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [type, setType] = useState<string>('akademik');
  const [dateStr, setDateStr] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!profile) return;
    const [bk, myBookings] = await Promise.all([
      getCollection('users', where('role', '==', 'BK')),
      USE_MOCK ? Promise.resolve([]) : getCollection('counseling', where('studentId', '==', profile.uid)),
    ]);
    if ((bk as any[]).length > 0) setBkTeacherId((bk[0] as any).uid);
    setBookings((myBookings as any[]).sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()));
    setLoading(false);
  };

  useEffect(() => { load(); }, [profile]);

  const handleBook = async () => {
    if (!bkTeacherId) return Alert.alert('Guru BK belum tersedia');
    if (!dateStr) return Alert.alert('Pilih tanggal konseling');
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return Alert.alert('Format tanggal: YYYY-MM-DD');
    setSaving(true);
    try {
      if (!USE_MOCK) {
        await addDocument('counseling', {
          studentId: profile!.uid, bkTeacherId, type,
          scheduledAt: Timestamp.fromDate(d), status: 'booked',
          notes: notes.trim(),
        });
      }
      Alert.alert('Berhasil', 'Booking konseling berhasil!');
      setModal(false); setNotes(''); setDateStr('');
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    booked:   { bg: Colors.gray11, color: Colors.gray3  },
    ongoing:  { bg: Colors.gray10, color: Colors.gray2  },
    resolved: { bg: Colors.gray11, color: Colors.gray6  },
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.title}>Konseling BK</Text>
          <Text style={styles.sub}>Bimbingan bersifat rahasia dan aman</Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.bookBtnText}>Booking</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Belum ada booking</Text>
            <Text style={styles.emptySub}>Tap "Booking" untuk request sesi konseling</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sc = STATUS_STYLE[item.status] ?? STATUS_STYLE.booked;
          return (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.typePill]}>
                  <Text style={styles.typePillText}>{item.type}</Text>
                </View>
                <Text style={styles.dateText}>
                  {item.scheduledAt?.toDate?.().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                {item.notes ? <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text> : null}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.statusText, { color: sc.color }]}>{item.status}</Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>Booking Sesi Konseling</Text>

            <Text style={styles.label}>Jenis Masalah</Text>
            <View style={styles.typeRow}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, type === t && styles.chipActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tanggal (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input} value={dateStr} onChangeText={setDateStr}
              placeholder="2026-08-15" placeholderTextColor={Colors.gray7}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.label}>Catatan (opsional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={notes} onChangeText={setNotes} multiline
              placeholder="Ceritakan singkat permasalahan kamu..." placeholderTextColor={Colors.gray7}
            />

            <View style={styles.btns}>
              <Button title="Batal" onPress={() => setModal(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Booking" onPress={handleBook} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  title: { ...Typography.title2, color: Colors.white },
  sub: { ...Typography.caption1, color: 'rgba(255,255,255,0.45)', marginTop: 4, maxWidth: 200 },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  bookBtnText: { ...Typography.subheadline, color: Colors.white, fontWeight: '600' },
  list: { padding: Spacing.base },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.sm,
  },
  cardLeft: { flex: 1 },
  typePill: { marginBottom: 4 },
  typePillText: { ...Typography.subheadline, color: Colors.black, fontWeight: '600', textTransform: 'capitalize' },
  dateText: { ...Typography.footnote, color: Colors.secondaryLabel },
  notesText: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 4, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { ...Typography.caption1, fontWeight: '700', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
  emptySub: { ...Typography.subheadline, color: Colors.tertiaryLabel, textAlign: 'center', maxWidth: 240 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl },
  sheetTitle: { ...Typography.title3, color: Colors.black, marginBottom: Spacing.base },
  label: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginTop: Spacing.md },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { ...Typography.footnote, color: Colors.secondaryLabel, fontWeight: '500', textTransform: 'capitalize' },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  input: {
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: Spacing.md,
    ...Typography.body, color: Colors.black, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  btns: { flexDirection: 'row', gap: 10, marginTop: Spacing.xl },
});
