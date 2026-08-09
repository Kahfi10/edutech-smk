import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, addDocument, where } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { BottomSheet } from '../../src/components/shared/BottomSheet';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';

const CATEGORIES = ['Terlambat', 'Bolos', 'Atribut', 'HP di Kelas', 'Perkelahian', 'Lainnya'];

export default function WaliViolationsScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [violations, setViolations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selectedSid, setSelectedSid] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [desc, setDesc] = useState('');
  const [points, setPoints] = useState('5');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!profile?.classId) { setLoading(false); return; }
    const [studs, viols] = await Promise.all([
      getCollection('users', where('role', '==', 'STUDENT'), where('classId', '==', profile.classId)),
      getCollection('violations'),
    ]);
    setStudents(studs as any[]);
    const map: Record<string, any> = {};
    (studs as any[]).forEach((s: any) => (map[s.uid] = s));
    setStudentMap(map);
    const myViolations = (viols as any[]).filter(v => map[v.studentId])
      .sort((a, b) => b.date?.toDate?.() - a.date?.toDate?.());
    setViolations(myViolations);
    setLoading(false);
  };

  useEffect(() => { load(); }, [profile]);

  const handleAdd = async () => {
    if (!selectedSid) return Alert.alert('Pilih siswa terlebih dahulu');
    const p = parseInt(points);
    if (isNaN(p) || p < 1) return Alert.alert('Poin tidak valid');
    if (!desc.trim()) return Alert.alert('Deskripsi wajib diisi');
    setSaving(true);
    try {
      await addDocument('violations', {
        studentId: selectedSid, points: p, category,
        description: desc.trim(), reportedBy: profile!.uid,
        reportedByRole: 'WALI', status: 'pending', date: Timestamp.now(),
      });
      setModal(false); setDesc(''); setPoints('5'); setSelectedSid('');
      await load();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Pelanggaran Kelas</Text>
          <Text style={styles.headerSub}>{violations.length} catatan</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={violations}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Belum ada pelanggaran</Text>
          </View>
        }
        renderItem={({ item }) => {
          const s = studentMap[item.studentId];
          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{s?.name ?? item.studentId}</Text>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.meta}>
                  {item.date?.toDate?.().toLocaleDateString('id-ID')}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.pts}>+{item.points}</Text>
                <Badge
                  label={item.status === 'verified' ? 'Verified' : 'Pending'}
                  variant={item.status === 'verified' ? 'default' : 'outline'}
                />
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />

      <BottomSheet visible={modal} onClose={() => setModal(false)}>
        <Text style={styles.sheetTitle}>Catat Pelanggaran</Text>

        <Text style={styles.label}>Siswa</Text>
        <FlatList
          horizontal data={students} keyExtractor={i => i.uid}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.chip, selectedSid === item.uid && styles.chipActive]} onPress={() => setSelectedSid(item.uid)}>
              <Text style={[styles.chipText, selectedSid === item.uid && styles.chipTextActive]}>{item.name.split(' ')[0]}</Text>
            </TouchableOpacity>
          )}
        />

        <Text style={styles.label}>Kategori</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Deskripsi</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={desc} onChangeText={setDesc}
          placeholder="Jelaskan pelanggaran..." placeholderTextColor={Colors.gray7}
          multiline returnKeyType="done"
        />

        <Text style={styles.label}>Poin</Text>
        <TextInput
          style={[styles.input, { width: 80 }]}
          value={points} onChangeText={setPoints} keyboardType="numeric" returnKeyType="done"
        />

        <View style={styles.btns}>
          <Button title="Batal" onPress={() => setModal(false)} variant="ghost" style={{ flex: 1 }} />
          <Button title="Simpan" onPress={handleAdd} loading={saving} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.gray2, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { ...Typography.title2, color: Colors.white },
  headerSub: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  addBtnText: { ...Typography.subheadline, color: Colors.white, fontWeight: '600' },
  list: { padding: Spacing.base, backgroundColor: Colors.cardBackground },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 13, paddingHorizontal: Spacing.base,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: Spacing.base },
  studentName: { ...Typography.subheadline, color: Colors.black, fontWeight: '600' },
  category: { ...Typography.caption1, color: Colors.gray5, fontWeight: '600', marginTop: 2 },
  descText: { ...Typography.footnote, color: Colors.secondaryLabel, marginTop: 2 },
  meta: { ...Typography.caption2, color: Colors.tertiaryLabel, marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 6 },
  pts: { fontSize: 20, fontWeight: '800', color: Colors.gray1 },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl },
  sheetTitle: { ...Typography.title3, color: Colors.black, marginBottom: Spacing.base },
  label: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: Spacing.md, marginBottom: 6 },
  input: {
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: Spacing.md,
    ...Typography.body, color: Colors.black, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
    backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { ...Typography.footnote, color: Colors.secondaryLabel, fontWeight: '500' },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  btns: { flexDirection: 'row', gap: 10, marginTop: Spacing.xl },
});
