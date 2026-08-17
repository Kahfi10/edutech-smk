import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, deleteDocument, subscribeCollection } from '../../src/firebase/firestore.service';
import { createUser } from '../../src/firebase/auth.service';
import { BottomSheet } from '../../src/components/shared/BottomSheet';
import { Button } from '../../src/components/ui/Button';
import { SkeletonListItem } from '../../src/components/ui/Skeleton';
import { useToast } from '../../src/context/ToastContext';
import { hapticWarning, hapticSuccess, hapticError, hapticLight } from '../../src/services/haptics';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

const ROLES = ['Semua', 'STUDENT', 'TEACHER', 'WALI', 'BK', 'PIKET'];
const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Siswa', TEACHER: 'Guru Mapel', WALI: 'Wali Kelas',
  BK: 'Guru BK', PIKET: 'Guru Piket', ADMIN: 'Admin',
};
// Label pendek untuk filter chip — tidak perlu scroll horizontal
const ROLE_SHORT: Record<string, string> = {
  Semua: 'Semua', STUDENT: 'Siswa', TEACHER: 'Guru',
  WALI: 'Wali', BK: 'BK', PIKET: 'Piket',
};

export default function AdminUsers() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [users, setUsers]           = useState<any[]>([]);
  const [classes, setClasses]       = useState<any[]>([]);
  const [filter, setFilter]         = useState('Semua');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]           = useState(false);
  const [saving, setSaving]         = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'STUDENT', nis: '', classId: '',
  });

  // Classes: one-time fetch (jarang berubah)
  useEffect(() => {
    getCollection('classes').then(cls => setClasses(cls as any[]));
  }, []);

  // Users: realtime listener
  useEffect(() => {
    const unsub = subscribeCollection('users', (data) => {
      setUsers(data as any[]);
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); };

  const filtered = filter === 'Semua'
    ? users
    : users.filter(u => u.role === filter);

  const handleDelete = (u: any) => {
    hapticWarning();
    Alert.alert(
      'Hapus Pengguna',
      `Hapus akun ${u.name}? Akun Firebase Auth tidak akan terhapus otomatis.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument('users', u.uid);
              // listener otomatis update list
              hapticSuccess();
              showToast(`${u.name} dihapus`, 'success');
            } catch {
              hapticError();
              showToast('Gagal menghapus', 'error');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      showToast('Nama, email, dan password wajib diisi', 'warning');
      return;
    }
    setSaving(true);
    try {
      await createUser(form.email.trim(), form.password, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role as any,
        ...(form.role === 'STUDENT' && {
          nis: form.nis.trim(),
          classId: form.classId,
        }),
      });
      hapticSuccess();
      showToast(`${form.name} berhasil ditambahkan`, 'success');
      setModal(false);
      setForm({ name: '', email: '', password: '', role: 'STUDENT', nis: '', classId: '' });
      // listener otomatis update list
    } catch (e: any) {
      hapticError();
      showToast(e.message ?? 'Gagal membuat akun', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 30).springify().damping(18)}>
      <View style={s.userRow}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{item.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.userName}>{item.name}</Text>
          <Text style={s.userSub} numberOfLines={1}>
            {item.email}{item.nis ? ` · NIS ${item.nis}` : ''}
          </Text>
        </View>
        <View style={s.rolePill}>
          <Text style={s.rolePillText}>{ROLE_LABEL[item.role] ?? item.role}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8} style={{ marginLeft: 6 }}>
          <Ionicons name="trash-outline" size={18} color={Colors.gray7} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Pengguna</Text>
        <TouchableOpacity
          onPress={() => { hapticLight(); setModal(true); }}
          style={s.addBtn}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Role filter — wrap grid, semua chip terlihat tanpa scroll */}
      <View style={s.filterSection}>
        <View style={s.filterRow}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r}
              style={[s.filterChip, filter === r && s.filterChipActive]}
              onPress={() => { hapticLight(); setFilter(r); }}
            >
              <Text style={[s.filterChipText, filter === r && s.filterChipTextActive]}>
                {ROLE_SHORT[r] ?? r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Count */}
      <Text style={s.countText}>{filtered.length} pengguna</Text>

      {/* List */}
      {loading ? (
        <FlatList
          data={Array(6).fill(null)}
          keyExtractor={(_, i) => String(i)}
          renderItem={() => <SkeletonListItem />}
          ItemSeparatorComponent={() => <View style={s.divider} />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.uid}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={s.divider} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gray5} colors={[Colors.black]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.gray8} />
              <Text style={s.emptyText}>Tidak ada pengguna</Text>
            </View>
          }
        />
      )}

      {/* Add User Sheet */}
      <BottomSheet visible={modal} onClose={() => setModal(false)}>
        <Text style={s.sheetTitle}>Tambah Pengguna</Text>

        <Text style={s.label}>NAMA LENGKAP</Text>
        <TextInput style={s.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Nama lengkap" placeholderTextColor={Colors.gray7} />

        <Text style={s.label}>EMAIL</Text>
        <TextInput style={s.input} value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="email@sekolah.sch.id" placeholderTextColor={Colors.gray7} keyboardType="email-address" autoCapitalize="none" />

        <Text style={s.label}>PASSWORD</Text>
        <TextInput style={s.input} value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} placeholder="Min. 6 karakter" placeholderTextColor={Colors.gray7} secureTextEntry />

        <Text style={s.label}>ROLE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
            {(['STUDENT', 'TEACHER', 'WALI', 'BK', 'PIKET'] as const).map(r => (
              <TouchableOpacity
                key={r}
                style={[s.roleSel, form.role === r && s.roleSelActive]}
                onPress={() => setForm(f => ({ ...f, role: r }))}
              >
                <Text style={[s.roleSelText, form.role === r && s.roleSelTextActive]}>
                  {ROLE_LABEL[r]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {form.role === 'STUDENT' && (
          <>
            <Text style={s.label}>NIS</Text>
            <TextInput style={s.input} value={form.nis} onChangeText={v => setForm(f => ({ ...f, nis: v }))} placeholder="Nomor Induk Siswa" placeholderTextColor={Colors.gray7} keyboardType="numeric" />

            <Text style={s.label}>KELAS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                {classes.map(cls => (
                  <TouchableOpacity
                    key={cls.id}
                    style={[s.roleSel, form.classId === cls.id && s.roleSelActive]}
                    onPress={() => setForm(f => ({ ...f, classId: cls.id }))}
                  >
                    <Text style={[s.roleSelText, form.classId === cls.id && s.roleSelTextActive]}>
                      {cls.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Button title="Batal" onPress={() => setModal(false)} variant="ghost" style={{ flex: 1 }} />
          <Button title="Simpan" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
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
  title:   { ...Typography.title3, color: Colors.white },
  addBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  filterSection: { backgroundColor: Colors.cardBackground, paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator },
  filterChipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  // fontSize eksplisit tanpa letterSpacing — mencegah rendering dash di web
  filterChipText: { fontSize: 13, fontWeight: '500' as const, color: Colors.secondaryLabel },
  filterChipTextActive: { color: Colors.white },
  countText: { fontSize: 12, color: Colors.tertiaryLabel, marginHorizontal: Spacing.base, marginTop: 10, marginBottom: 4 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.base, paddingVertical: 13, backgroundColor: Colors.cardBackground },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.headline, color: Colors.gray3, fontWeight: '600' },
  userName: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  userSub:  { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 1 },
  rolePill: { backgroundColor: Colors.gray11, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  rolePillText: { fontSize: 11, fontWeight: '600' as const, color: Colors.gray4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: 68 },
  empty: { alignItems: 'center', paddingTop: 64, gap: 10 },
  emptyText: { fontSize: 15, color: Colors.tertiaryLabel },
  sheetTitle: { fontSize: 20, fontWeight: '600' as const, color: Colors.black, marginBottom: 4 },
  label: { fontSize: 11, color: Colors.tertiaryLabel, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: Spacing.md, fontSize: 17, color: Colors.black, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator },
  roleSel: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator },
  roleSelActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  roleSelText: { fontSize: 13, fontWeight: '500' as const, color: Colors.secondaryLabel },
  roleSelTextActive: { color: Colors.white },
});
