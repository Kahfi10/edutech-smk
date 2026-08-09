import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { subscribeCollection, getCollection, setDocument, updateDocument, where } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';

const EVENT_TYPES = [
  { key: 'terlambat',   label: 'Terlambat',   color: Colors.gray3, bg: Colors.gray11 },
  { key: 'izin_pulang', label: 'Izin Pulang',  color: Colors.gray4, bg: Colors.gray10 },
  { key: 'kejadian',    label: 'Kejadian',     color: Colors.gray2, bg: Colors.gray11 },
] as const;

export default function DailyLogScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [todayLog, setTodayLog] = useState<any>(null);
  const [logId, setLogId] = useState('');
  const [modal, setModal] = useState(false);
  const [eventType, setEventType] = useState<string>('terlambat');
  const [studentNis, setStudentNis] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile) return;
    const id = `${today}_${profile.uid}`;
    setLogId(id);
    const unsub = subscribeCollection('piket_logs', (data) => {
      const found = data.find((l: any) => l.date === today && l.piketTeacherId === profile.uid);
      setTodayLog(found ?? null);
    });
    return unsub;
  }, [profile]);

  const addEvent = async () => {
    if (!desc.trim()) return Alert.alert('Keterangan wajib diisi');
    setSaving(true);
    try {
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const newEvent = { studentId: studentNis || '-', type: eventType, description: desc.trim(), time: now };
      if (!todayLog) {
        await setDocument('piket_logs', logId, {
          date: today, piketTeacherId: profile!.uid,
          events: [newEvent], createdAt: Timestamp.now(),
        });
      } else {
        await updateDocument('piket_logs', logId, {
          events: [...(todayLog.events ?? []), newEvent],
        });
      }
      setModal(false); setDesc(''); setStudentNis('');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const events: any[] = todayLog?.events ?? [];

  const typeLabel = (key: string) => EVENT_TYPES.find(e => e.key === key)?.label ?? key;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Buku Piket</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>Catat</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        {EVENT_TYPES.map(et => {
          const count = events.filter(e => e.type === et.key).length;
          return (
            <View key={et.key} style={styles.statItem}>
              <Text style={styles.statVal}>{count}</Text>
              <Text style={styles.statKey}>{et.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Log list */}
      <FlatList
        data={events}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Belum ada catatan hari ini</Text>
            <Text style={styles.emptySub}>Tap "Catat" untuk tambah kejadian</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const et = EVENT_TYPES.find(e => e.key === item.type);
          return (
            <View style={styles.eventRow}>
              <Text style={styles.eventTime}>{item.time}</Text>
              <View style={[styles.eventTypePill, { backgroundColor: et?.bg ?? Colors.gray11 }]}>
                <Text style={[styles.eventTypeText, { color: et?.color ?? Colors.gray4 }]}>
                  {typeLabel(item.type)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
                {item.studentId && item.studentId !== '-' && (
                  <Text style={styles.eventNis}>NIS: {item.studentId}</Text>
                )}
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => (
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: Spacing.base + 58 }} />
        )}
      />

      {/* Modal tambah kejadian */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>Catat Kejadian</Text>

            <Text style={styles.label}>Tipe Kejadian</Text>
            <View style={styles.typeRow}>
              {EVENT_TYPES.map(et => (
                <TouchableOpacity
                  key={et.key}
                  style={[styles.chip, eventType === et.key && styles.chipActive]}
                  onPress={() => setEventType(et.key)}
                >
                  <Text style={[styles.chipText, eventType === et.key && styles.chipTextActive]}>
                    {et.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>NIS Siswa (opsional)</Text>
            <TextInput
              style={styles.input} value={studentNis} onChangeText={setStudentNis}
              placeholder="Contoh: 2024001" keyboardType="numeric"
              placeholderTextColor={Colors.gray7}
            />

            <Text style={styles.label}>Keterangan</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={desc} onChangeText={setDesc} multiline
              placeholder="Jelaskan kejadian..." placeholderTextColor={Colors.gray7}
            />

            <View style={styles.btns}>
              <Button title="Batal" onPress={() => setModal(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Simpan" onPress={addEvent} loading={saving} style={{ flex: 1 }} />
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
  headerTitle: { ...Typography.title2, color: Colors.white },
  headerDate: { ...Typography.footnote, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  addBtnText: { ...Typography.subheadline, color: Colors.white, fontWeight: '600' },
  statsStrip: {
    flexDirection: 'row', backgroundColor: Colors.cardBackground,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statVal: { ...Typography.title3, color: Colors.black },
  statKey: { ...Typography.caption2, color: Colors.tertiaryLabel, marginTop: 2 },
  list: { backgroundColor: Colors.cardBackground },
  eventRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
  },
  eventTime: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', width: 38, paddingTop: 2 },
  eventTypePill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full,
    alignSelf: 'flex-start', minWidth: 70, alignItems: 'center',
  },
  eventTypeText: { ...Typography.caption2, fontWeight: '700' },
  eventDesc: { ...Typography.footnote, color: Colors.black, flex: 1 },
  eventNis: { ...Typography.caption2, color: Colors.tertiaryLabel, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
  emptySub: { ...Typography.subheadline, color: Colors.tertiaryLabel, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl },
  sheetTitle: { ...Typography.title3, color: Colors.black, marginBottom: Spacing.base },
  label: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginTop: Spacing.md },
  typeRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { ...Typography.footnote, color: Colors.secondaryLabel },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  input: {
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: Spacing.md,
    ...Typography.body, color: Colors.black, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  btns: { flexDirection: 'row', gap: 10, marginTop: Spacing.xl },
});
