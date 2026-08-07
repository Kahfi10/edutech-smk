import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { getCollection, subscribeCollection, where } from '../../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../src/constants/theme';
import { USE_MOCK } from '../../../src/constants/mockData';

export default function MaterialsScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock subjects
  const MOCK_SUBJECTS = [
    { id: 'subj_pemweb', name: 'Pemrograman Web' },
    { id: 'subj_basis_data', name: 'Basis Data' },
  ];
  const MOCK_MATERIALS = [
    { id: 'm1', title: 'Pengenalan HTML & CSS', type: 'pdf', description: 'Dasar-dasar HTML dan CSS untuk web', createdAt: { toDate: () => new Date() } },
    { id: 'm2', title: 'JavaScript Fundamentals', type: 'pdf', description: 'Variabel, fungsi, dan DOM manipulation', createdAt: { toDate: () => new Date() } },
    { id: 'm3', title: 'Demo Membuat Website', type: 'video', description: 'Tutorial membuat website dari nol', createdAt: { toDate: () => new Date() } },
  ];

  useEffect(() => {
    if (USE_MOCK) {
      setSubjects(MOCK_SUBJECTS);
      setSelected(MOCK_SUBJECTS[0].id);
      setMaterials(MOCK_MATERIALS);
      setLoading(false);
      return;
    }
    if (!profile?.classId) { setLoading(false); return; }
    getCollection('subjects').then(data => {
      const filtered = (data as any[]).filter(s => s.classIds?.includes(profile.classId));
      setSubjects(filtered);
      if (filtered.length > 0) setSelected(filtered[0].id);
    }).finally(() => setLoading(false));
  }, [profile]);

  useEffect(() => {
    if (USE_MOCK || !selected) return;
    setLoading(true);
    getCollection('materials', where('subjectId', '==', selected))
      .then(setMaterials).finally(() => setLoading(false));
  }, [selected]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {/* Subject tabs */}
      <View style={[styles.tabBar, { paddingTop: insets.top }]}>
        <Text style={styles.pageTitle}>Materi Pelajaran</Text>
        <FlatList
          horizontal data={subjects} keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, selected === item.id && styles.tabActive]}
              onPress={() => setSelected(item.id)}
            >
              <Text style={[styles.tabText, selected === item.id && styles.tabTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Materials list */}
      <FlatList
        data={materials}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={44} color={Colors.gray8} />
            <Text style={styles.emptyText}>Belum ada materi</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconBox, item.type === 'video' && styles.iconBoxVideo]}>
                <Ionicons
                  name={item.type === 'pdf' ? 'document-text-outline' : 'play-circle-outline'}
                  size={22}
                  color={Colors.gray3}
                />
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
              ) : null}
              <View style={styles.cardMeta}>
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{item.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.dateText}>
                  {item.createdAt?.toDate?.().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.openBtn}
              onPress={() => USE_MOCK
                ? Alert.alert('Mock Mode', 'File tidak tersedia di mock mode.')
                : Linking.openURL(item.fileUrl).catch(() => Alert.alert('Error', 'Tidak dapat membuka file.'))
              }
            >
              <Ionicons name="arrow-forward-circle-outline" size={26} color={Colors.gray4} />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  tabBar: {
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
    ...Shadow.xs,
  },
  pageTitle: {
    ...Typography.title3,
    color: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  tabs: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: 8 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  tabActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  tabText: { ...Typography.subheadline, color: Colors.secondaryLabel },
  tabTextActive: { color: Colors.white, fontWeight: '600' },

  list: { padding: Spacing.base },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    ...Shadow.xs,
  },
  cardLeft: {},
  iconBox: {
    width: 48, height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.gray11,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxVideo: { backgroundColor: Colors.gray10 },
  cardBody: { flex: 1 },
  cardTitle: { ...Typography.subheadline, color: Colors.black, fontWeight: '600' },
  cardDesc:  { ...Typography.footnote, color: Colors.tertiaryLabel, marginTop: 3 },
  cardMeta:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  typePill: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: Colors.gray11,
  },
  typePillText: { ...Typography.caption2, color: Colors.gray5, fontWeight: '700', letterSpacing: 0.3 },
  dateText: { ...Typography.caption1, color: Colors.quaternaryLabel },
  openBtn: { padding: 4 },
  separator: { height: 8 },

  empty: { alignItems: 'center', paddingVertical: 56, gap: 10 },
  emptyText: { ...Typography.subheadline, color: Colors.tertiaryLabel },
});
