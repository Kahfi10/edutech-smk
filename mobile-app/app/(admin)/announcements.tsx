import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Switch, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { getCollection, addDocument, deleteDocument, subscribeCollection, orderBy } from '../../src/firebase/firestore.service';
import { BottomSheet } from '../../src/components/shared/BottomSheet';
import { Button } from '../../src/components/ui/Button';
import { useToast } from '../../src/context/ToastContext';
import { hapticWarning, hapticSuccess, hapticError, hapticLight } from '../../src/services/haptics';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';

export default function AdminAnnouncements() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [title, setTitle]       = useState('');
  const [message, setMessage]   = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  // Realtime listener — auto update saat ada tambah/hapus dari device manapun
  useEffect(() => {
    const unsub = subscribeCollection(
      'announcements',
      (data) => {
        const sorted = [...data].sort(
          (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
        );
        setAnnouncements(sorted);
        setLoading(false);
        setRefreshing(false);
      },
      orderBy('createdAt', 'desc'),
    );
    return unsub;
  }, []);

  const load = useCallback(() => {}, []); // retained for RefreshControl
  const onRefresh = () => { setRefreshing(true); /* listener will update */ setTimeout(() => setRefreshing(false), 600); };

  const handleDelete = (item: any) => {
    hapticWarning();
    Alert.alert('Hapus Pengumuman', `Hapus "${item.title}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument('announcements', item.id);
            // listener otomatis update list, tidak perlu setAnnouncements manual
            hapticSuccess();
            showToast('Pengumuman dihapus', 'success');
          } catch {
            hapticError();
            showToast('Gagal menghapus', 'error');
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!title.trim() || !message.trim()) {
      showToast('Judul dan pesan wajib diisi', 'warning');
      return;
    }
    setSaving(true);
    try {
      const doc = await addDocument('announcements', {
        title: title.trim(),
        message: message.trim(),
        isUrgent,
        createdAt: Timestamp.now(),
      });
      hapticSuccess();
      showToast('Pengumuman dibuat', 'success');
      setModal(false);
      setTitle('');
      setMessage('');
      setIsUrgent(false);
      // listener otomatis munculkan di list
    } catch {
      hapticError();
      showToast('Gagal membuat pengumuman', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const dateStr = item.createdAt?.toDate?.().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    }) ?? '-';

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).springify().damping(18)}>
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                {item.isUrgent && (
                  <View style={s.urgentBadge}>
                    <Text style={s.urgentText}>URGENT</Text>
                  </View>
                )}
              </View>
              <Text style={s.cardDate}>{dateStr}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={Colors.gray7} />
            </TouchableOpacity>
          </View>
          <Text style={s.cardMsg} numberOfLines={3}>{item.message}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Pengumuman</Text>
        <TouchableOpacity onPress={() => { hapticLight(); setModal(true); }} style={s.addBtn}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={announcements}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: Spacing.base, gap: Spacing.sm, paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gray5} colors={[Colors.black]} />}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Ionicons name="megaphone-outline" size={48} color={Colors.gray8} />
              <Text style={s.emptyText}>Belum ada pengumuman</Text>
              <Text style={s.emptySub}>Tap + untuk membuat pengumuman baru</Text>
            </View>
          ) : null
        }
      />

      <BottomSheet visible={modal} onClose={() => setModal(false)}>
        <Text style={s.sheetTitle}>Buat Pengumuman</Text>

        <Text style={s.label}>JUDUL</Text>
        <TextInput
          style={s.input} value={title} onChangeText={setTitle}
          placeholder="Judul pengumuman" placeholderTextColor={Colors.gray7}
        />

        <Text style={s.label}>PESAN</Text>
        <TextInput
          style={[s.input, { height: 90, textAlignVertical: 'top' }]}
          value={message} onChangeText={setMessage}
          placeholder="Isi pengumuman..." placeholderTextColor={Colors.gray7}
          multiline
        />

        <View style={s.urgentRow}>
          <View>
            <Text style={s.urgentLabel}>Tandai sebagai URGENT</Text>
            <Text style={s.urgentDesc}>Tampil dengan badge merah di semua dashboard</Text>
          </View>
          <Switch
            value={isUrgent}
            onValueChange={v => { hapticLight(); setIsUrgent(v); }}
            trackColor={{ false: Colors.gray9, true: Colors.gray3 }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Button title="Batal" onPress={() => setModal(false)} variant="ghost" style={{ flex: 1 }} />
          <Button title="Kirim" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'flex-end',
  },
  title:  { ...Typography.title3, color: Colors.white },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg,
    padding: Spacing.base, borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator, ...Shadow.xs, gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle:  { ...Typography.headline, color: Colors.black, fontWeight: '600', flex: 1 },
  cardDate:   { ...Typography.caption1, color: Colors.tertiaryLabel },
  cardMsg:    { ...Typography.subheadline, color: Colors.secondaryLabel, lineHeight: 20 },
  urgentBadge: { backgroundColor: Colors.gray2, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  urgentText:  { ...Typography.caption2, color: Colors.white, fontWeight: '700', letterSpacing: 0.5 },
  empty:    { alignItems: 'center', paddingTop: 64, gap: 8 },
  emptyText:{ ...Typography.subheadline, color: Colors.tertiaryLabel },
  emptySub: { ...Typography.footnote, color: Colors.quaternaryLabel, textAlign: 'center' },
  sheetTitle: { ...Typography.title3, color: Colors.black, marginBottom: 4 },
  label: { ...Typography.caption2, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: Spacing.md, ...Typography.body, color: Colors.black, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator },
  urgentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.base, padding: Spacing.md, backgroundColor: Colors.gray11, borderRadius: Radius.md },
  urgentLabel: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  urgentDesc:  { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
});
