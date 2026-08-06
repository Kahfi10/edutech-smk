import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { getCollection, where } from '../../../src/firebase/firestore.service';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';

export default function MaterialsScreen() {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.classId) return;
    getCollection('subjects').then(data => {
      const filtered = data.filter((s: any) => s.classIds?.includes(profile.classId));
      setSubjects(filtered);
      if (filtered.length > 0) setSelectedSubject(filtered[0].id);
    }).finally(() => setLoading(false));
  }, [profile]);

  useEffect(() => {
    if (!selectedSubject) return;
    setLoading(true);
    getCollection('materials', where('subjectId', '==', selectedSubject))
      .then(setMaterials)
      .finally(() => setLoading(false));
  }, [selectedSubject]);

  const openMaterial = (url: string, type: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Tidak dapat membuka file. Pastikan URL valid.')
    );
  };

  return (
    <View style={styles.container}>
      {/* Subject tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal data={subjects} keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, selectedSubject === item.id && styles.tabActive]}
              onPress={() => setSelectedSubject(item.id)}
            >
              <Text style={[styles.tabText, selectedSubject === item.id && styles.tabTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={materials}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Belum ada materi di mata pelajaran ini</Text>}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.materialRow}>
                <Text style={styles.materialIcon}>{item.type === 'pdf' ? '📄' : '🎥'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.materialTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.materialDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  <Text style={styles.materialDate}>
                    {item.createdAt?.toDate?.().toLocaleDateString('id-ID') ?? ''}
                  </Text>
                </View>
                <Badge label={item.type.toUpperCase()} bg={item.type === 'pdf' ? '#EEF2FF' : '#FEF3C7'} color={item.type === 'pdf' ? '#4F46E5' : '#92400E'} />
              </View>
              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => openMaterial(item.fileUrl, item.type)}
              >
                <Text style={styles.openBtnText}>
                  {item.type === 'pdf' ? '📖 Buka PDF' : '▶️ Tonton Video'}
                </Text>
              </TouchableOpacity>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  tabsContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabs: { padding: 10, gap: 8 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  tabActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },
  list: { padding: 16 },
  materialRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  materialIcon: { fontSize: 32 },
  materialTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  materialDesc: { fontSize: 12, color: '#64748B', marginTop: 3 },
  materialDate: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  openBtn: {
    marginTop: 10, backgroundColor: '#EEF2FF', borderRadius: 8,
    padding: 10, alignItems: 'center',
  },
  openBtnText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 32, fontSize: 14 },
});
